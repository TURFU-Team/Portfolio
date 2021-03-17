let landscape = true;
let allTimeline = {};

//Quelques fonctions utiles

//Clamp tronque un nombre pour retourner sa valeur dans l'interval
function clamp(value, min, max){
    if(value < min){
        return min;
    }
    if(value > max){
        return max;
    }
    return value;
}

//Map va projeter une valeur sur un interval d'entrée et retourner l'équivalent sur l'interval de sortie
function map(value, InMin, InMax, OutMin, OutMax) {
    value = clamp(value, InMin, InMax);
    let scalar = (value-InMin) / (InMax-InMin);
    return (OutMax-OutMin)*scalar + OutMin;
};

//Objet de type Timeline
let Timeline = function(id) {
    let attr = {
        targetElem: $('.timeline').eq(id),
        size: $('.timeline').eq(id).data('length'),
        numDiv: $('.timeline').eq(id).data('numgraduation'),
        divCSS: $('.timeline').eq(id).data('segmentclass'),
        offset: $('.timeline').eq(id).data('startoffset'),
        minScale: $('.timeline').eq(id).data('minscale'),
        maxScale: $('.timeline').eq(id).data('maxscale')
    };
    let self = this;
    let slides = {};
    let slidesPos = [];
    if(attr.offset === undefined) {
        attr.offset = 0;
    }
    //constructeur de Classe
    this.construct = function(id) {
        let interval = attr.size/attr.numDiv;
        //on récupère toutes les slides déjà contenues dans la timeline
        let child = $(attr.targetElem).children();
        for(let i=0; i<child.length; i++) {
            let numGrad = $(child).eq(i).data('timepose');
            slides[numGrad] = $(child).eq(i);
            $(slides[numGrad]).css('z-index', '404'); //pour que les slides s'affichent au-dessus des graduations
        }
        let cursor = null;
        for(let i=0; i<attr.numDiv; i++) {
            if(i in slides) {
                //il existe déjà une slide à cet endroit
                cursor = slides[i];
                slidesPos.push((i*interval)+(interval/2)-50) //on note l'offset de chaques slides
            }
            else if(cursor === null) {
                //place les premières graduation au début de la div
                $('<div class="' +  attr.divCSS + '"></div>').prependTo(attr.targetElem);
            }
            else {
                //insere à la suite de la dernière slide définie
                $('<div class="' +  attr.divCSS + '"></div>').insertAfter($(cursor));
            }
        }
        self.update();
    };
    //Fonctions Publiques
    this.update = function() {
        let interval = attr.size/attr.numDiv;
        $('div', attr.targetElem).each(function(i) { //placer toutes les div
            let size = getSizePercent(this);
            if(landscape) {
                //map sdiv screen pos from -1 (left: 0;) to 1 (left: 100%;)
                let screenPos = ((i*interval)-attr.offset+(interval/2)-50)/50;
                console.log(screenPos);
                $(this).css({
                    "left": (i*interval)-attr.offset+(interval/2)-(size.width/2) + '%',
                    "top": '',
                    "transform": 'scale(' + map(Math.abs(screenPos), 0, 1, attr.maxScale, attr.minScale) + ')'
                });
            }
            else {
                $(this).css({
                    "top": (i*interval)-attr.offset+(interval/2)-(size.height/2) + '%',
                    "left": ''
                });
            }
        });
    };
    this.move = function(delta) {
        attr.offset = clamp(attr.offset+delta, 0, attr.size-100);
        self.update();
    };
    this.moveNext = function() {
        for(let i=0; i<slidesPos.length; i++) {
            if(slidesPos[i] > attr.offset) {
                attr.offset = clamp(slidesPos[i], 0, attr.size);
                self.update();
                return;
            }
        }
    };
    this.movePrev = function() {
        for(let i=slidesPos.length-1; i>=0; i--) {
            if(slidesPos[i] < attr.offset) {
                attr.offset = clamp(slidesPos[i], 0, attr.size);
                self.update();
                return;
            }
        }
    };
    //Fonction Privées
    let getSizePercent = function(elem) {
        return {
            width: 100 * $(elem).width() / $(elem).offsetParent().width(),
            height: 100 * $(elem).height() / $(elem).offsetParent().height()
        };
    }
    this.construct(id);
};

function orientHandler(){
    if(window.innerHeight > window.innerWidth) {
        landscape = false;
    }
    else {
        landscape = true;
    }
    for (const [key, value] of Object.entries(allTimeline)) {
        value.update();
    }
};

$(function() {
    if(window.innerHeight > window.innerWidth) {
        landscape = false;
    }
    else {
        landscape = true;
    }
    $('.timeline').each(function() {
        let tml = new Timeline($(this).index());
        allTimeline[$(this).index()] = tml;
    });
    $(window).on({
        orientationchange: orientHandler,
        resize: orientHandler
    });
    let wheelEnabled = true;
    $('.timeline').on({
        swipeup: function() {
            if(!landscape) {
                allTimeline[$(this).index()].moveNext();
            }
        },
        swipedown: function() {
            if(!landscape) {
                allTimeline[$(this).index()].movePrev();
            }
        },
        swipeleft: function() {
            if(landscape) {
                allTimeline[$(this).index()].moveNext();
            }
        },
        swiperight: function() {
            if(landscape) {
                allTimeline[$(this).index()].movePrev();
            }
        },
        wheel: function(e) {
            if(e.originalEvent.deltaY > .8 && wheelEnabled) {
                allTimeline[$(this).index()].moveNext();
            }
            else if(e.originalEvent.deltaY < -.8 && wheelEnabled) {
                allTimeline[$(this).index()].movePrev();
                
            }
            else {
                return;
            }
            wheelEnabled = false;
            setTimeout(function() {wheelEnabled = true;}, 300); //pour éviter de déclencher plusieurs évènements de scroll à la suite
        }
    });
});