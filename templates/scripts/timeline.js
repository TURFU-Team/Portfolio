const maxOffset = 300;
let landscape = false;
let timelineOffset = {}; //contient la position actuelle sur les timelines

function clamp(value, min, max){
    if(value < min){
        return min;
    }
    if(value > max){
        return max;
    }
    return value;
}

function map(value, InMin, InMax, OutMin, OutMax) {
    value = clamp(value, InMin, InMax);
    let scalar = (value-InMin) / (InMax-InMin);
    return (OutMax-OutMin)*scalar + OutMin;
};

function placeTimelineElem(){
    $('.timelineContainer').each(function(i, val) {
        let length = $(val).data('length'); //On récupère les données de la timeline
        let numDiv = $(val).data('numgraduation');
        let minScale = $(val).data('minscale');
        let maxScale = $(val).data('maxscale');
        let interval = length/numDiv;
        let id = $(val).attr('id');
        let offset = timelineOffset[id];
        $('div', '#'+id).each(function(i) {
            let width = $(this).width();
            let parentWidth = $(this).offsetParent().width();
            let percentWitdh = Math.round(10000*width/parentWidth) / 100;
            let height = $(this).height();
            let parentHeigth = $(this).offsetParent().height();
            let percentHeigth = Math.round(10000*height/parentHeigth) / 100; 
            //multiplie le resultat par 100 pour mettre en pourcentage, encore par 100 (100*100=10000),
            //l'arrondit à l'entier le plus proche avant de re-diviser par 100 pour arrondir à deux chiffres après la virgule.
            if(landscape){
                $(this).css({
                    "left": (percentWitdh/2)*-1+(i*interval)-offset+(interval/2) + '%',
                    "top": 50-(percentHeigth/2) + '%',
                    "transform": 'scale(' + map(Math.abs(i*interval-offset+(interval/2)-50), 0, 50, maxScale, minScale) + ')'
                });
            }
            else {
                $(this).css({
                    "top": (percentHeigth/2)*-1+(i*interval)-offset+(interval/2) + '%',
                    "left": 50-(percentWitdh/2) + '%',
                    "transform": 'scale(' + map(Math.abs(i*interval-offset+(interval/2)-50), 0, 50, maxScale, minScale) + ')'
                });
            }
        });
    });
}

function orientHandler(){
    if(window.innerHeight > window.innerWidth) {
        landscape = false;
    }
    else {
        landscape = true;
    }
    setTimeout(placeTimelineElem, 700); //Je dois mettre un délai pour laisser le temps aux éléments de reprendre leur dimensions
    setTimeout(placeTimelineElem, 700);
};

$(function() {
    if(window.innerHeight > window.innerWidth) {
        landscape = false;
    }
    else {
        landscape = true;
    }
    $(window).on({
        orientationchange: orientHandler,
        resize: orientHandler
    });
    $('.timelineContainer').each(function(i, val) {
        let length = $(val).data('length'); //On récupère les données de la timeline
        let numDiv = $(val).data('numgraduation'); //The number of segments on the timeline (to control their spacing)
        let segmentClass = $(val).data('segmentclass');
        let offset = $(val).data('startoffset');
        if(offset === undefined) {
            offset = 0;
        }
        timelineOffset[$(val).attr('id')] = offset; //On garde en mémoire la position de scroll de chaque timelines.
        let frames = {}; //a frame is a div covering the screen at a certain point of the timeline
        let child = $(this).children();
        for(let i=0; i<child.length; i++) {
            let numFrame = $(child).eq(i).data('timepose');
            frames[numFrame] = $(child).eq(i); //mark the moments where a div is defined.
            $(child).eq(i).css('z-index', '404');
        }
        let cursor = null;
        for(let i=0; i<numDiv; i++) {
            if(i in frames) {
                cursor = frames[i];
            }
            else if(cursor === null){
                $('<div class="' +  segmentClass + '" style="transform: translateZ(10px)"></div>').prependTo(val);
            }
            else {
                $('<div class="' +  segmentClass + '" style="transform: translateZ(10px)"></div>').insertAfter($(cursor));
            }
        }    
    });
    placeTimelineElem();
    $('.timelineContainer').on({
        swipeup: function() {
            console.log('swipe up');
            if(!landscape) {
                timelineOffset[$(this).attr('id')] = clamp(timelineOffset[$(this).attr('id')] + 50, 0, $(this).data('length')-100);
                placeTimelineElem();
            }
        },
        swipedown: function() {
            console.log('swipe down');
            if(!landscape) {
                timelineOffset[$(this).attr('id')] = clamp(timelineOffset[$(this).attr('id')] - 50, 0, $(this).data('length')-100);
                placeTimelineElem();
            }
        },
        swipeleft: function() {
            console.log('swipe left');
            if(landscape) {
                timelineOffset[$(this).attr('id')] = clamp(timelineOffset[$(this).attr('id')] + 50, 0, $(this).data('length')-100);
                placeTimelineElem();
            }
        },
        swiperight: function() {
            console.log('swipe right');
            if(landscape) {
                timelineOffset[$(this).attr('id')] = clamp(timelineOffset[$(this).attr('id')] - 50, 0, $(this).data('length')-100);
                placeTimelineElem()
            }
        },
        wheel: function(e) {
            // console.log(e.originalEvent.deltaY);
            if(e.originalEvent.deltaY > 0){
                timelineOffset[$(this).attr('id')] = clamp(timelineOffset[$(this).attr('id')] + 20*e.originalEvent.deltaY, 0, $(this).data('length')-100);
                placeTimelineElem()
            }
            else {
                timelineOffset[$(this).attr('id')] = clamp(timelineOffset[$(this).attr('id')] + 20*e.originalEvent.deltaY, 0, $(this).data('length')-100);
                placeTimelineElem()
            }
            console.log( timelineOffset[$(this).attr('id')]);
        }
    });
});