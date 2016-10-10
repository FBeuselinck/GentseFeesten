//http://datatank.stad.gent/4/toerisme/gentsefeestenevents.json

var url = "http://datatank.stad.gent/4/toerisme/gentsefeestenevents.json";
var googleMap;
var boolWC = false;

$.getJSON("data/events.json", function( data ) {
    var uniqueData = filterData(data);
    dndTree(refactorData(uniqueData));
});

//unieke events filteren
function filterData(data){
    var ids = [];
    var uniqueData = [];
    $.each(data, function(e, event){
        if($.inArray(event.activiteit_id, ids) === -1){
            ids.push(event.activiteit_id);
            uniqueData.push(event);
        }
    });
    return uniqueData;
}

//data herordenen voor dndTree
function refactorData(data){
    var treeData = {};
    treeData.name = "Gentse Feesten";
    treeData.children = [{
        "name": "Datum",
        "children": []
    },{
        "name": "Categorie",
        "children": []
    },{
        "name": "Locatie",
        "children": []
    },{
        "name": "Gratis",
        "children": []
    },{
        "name": "Rolstoel toegang",
        "children": []
    },{
        "name": "Doventolk",
        "children": []
    }];

    $.each(data, function(e, event){
        //datum eerst naar iets leesbaar omzetten
        event.datum = $.datepicker.formatDate('dd-mm-yy', new Date(event.datum*1000));
        if(propertyInArray(treeData.children[0].children, event.datum)){
            treeData.children[0].children.push({"name": event.datum, "children": []});
        }
        if(propertyInArray(treeData.children[1].children, event.categorie_naam)){
            treeData.children[1].children.push({"name": event.categorie_naam, "children": []});
        }
        if(propertyInArray(treeData.children[2].children, event.locatie)){
            treeData.children[2].children.push({"name": event.locatie, "children": []});
        }
        if(event.gratis == true){
            treeData.children[3].children.push({"name": event.titel, "event": event});
        }
        if(event.toegankelijk_rolstoel == 1){
            treeData.children[4].children.push({"name": event.titel, "event": event});
        }
        if(event.doventolk == 1){
            treeData.children[5].children.push({"name": event.titel, "event": event});
        }
    });

    treeData.children[0].children = addEventsToDevision(treeData.children[0].children, data, "datum");
    treeData.children[1].children = addEventsToDevision(treeData.children[1].children, data, "categorie_naam");
    treeData.children[2].children = addEventsToDevision(treeData.children[2].children, data, "locatie");

    return treeData;
}

function propertyInArray(arr, prop){
    var bool;
    if(arr.length === 0){
        bool = true;
    }
    else{
        $.each(arr, function(i, item){
            if(item.name == prop){
                bool = false;
                return false;
            }
            else{
                bool = true;
            }
        });
    }
    return bool;
}

function addEventsToDevision(devision, data, prop){
    $.each(devision, function(s, subdevision){
        $.each(data, function(e, event){
            //console.log(event[prop]);
            if(subdevision.name == event[prop]){
                subdevision.children.push({"name": event.titel, "event": event});
            }
        });
    });
    return devision;
}

function viewDetail(event){
    //vorig event verwijderen
    $("#detail").empty();
    boolWC = false;

    //detail opvullen
    $("#detail").append(
        $("<img src='image/back-to-top.png' id='backToTop'/>")
    );
    $("#detail").append(
        $("<h1>" + event.titel + "</h1>")
    );
    if(event.afbeelding){
        $("#detail").append(
            $("<img src=" + event.afbeelding + " class='eventImg'/>")
        );
    }
    $("#detail").append(
        $("<ul>").append(
            $("<li>" + "<span>" + "Omschrijving: " + "</span>" + event.omschrijving + "</li>")
        ).append(
            $("<li>" + "<span>Organisatie: </span>" + event.organisatie + "</li>")
        ).append(
            $("<li>" + "<span>Categorie: </span>" + event.categorie_naam + "</li>")
        ).append(
            $("<li>" + "<span>Datum: </span>" + event.datum + "</li>")
        ).append(
            $("<li>" + "<span>URL: </span>" + "<a href=" + event.url + ">" + event.url + "</a>" + "</li>")
        ).append(
            $("<li>" + "<span>Locatie: </span>" + event.locatie + "</li>")
        )
    );
    $("#detail").append($("<div class='disabled'></div>"));
    if(event.toegankelijk_rolstoel){
        $(".disabled").append(
            $("<img src='image/wheelchair-icon.png'/>")
        );
    }
    if(event.doventolk){
        $(".disabled").append(
            $("<img src='image/sign-language-icon.png'/>")
        );
    }
    $("#detail").append($("<a id='toggleWC'>" + "WC" + "</a>"));
    initMap(event);
    $("html, body").animate({scrollTop: $("#detail").offset().top}, 500);
}

function initMap(event) {
    var locatie = {"lat": parseFloat(event.latitude),"lng": parseFloat(event.longitude)};
    googleMap = new google.maps.Map(document.getElementById("map-canvas"), {
        center: locatie,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var marker = new google.maps.Marker({
        position: locatie,
        map: googleMap,
        title: event.titel
    });
}

$(document).ready(function() {
    var wcMarkers = [];
    $('#detail').on('click','#toggleWC', function(){
        if(boolWC){
            boolWC = false;
            unmarkWC(wcMarkers);
            $("#toggleWC").css("background-color", "#91aa9d");
            $("#toggleWC").css("color", "#193441");
            $("#toggleWC").css("border", "1px #193441 solid");
        }
        else{
            boolWC = true;
            wcMarkers = markWC();
            $("#toggleWC").css("background-color", "#3e606f");
            $("#toggleWC").css("color", "#fcfff5");
            $("#toggleWC").css("border", "1px #fcfff5 solid");
        }
    });
    $('#detail').on('click', '#backToTop', function(){
        $("html, body").animate({scrollTop: 0}, 500);
    });
});

function markWC(){
    var wcMarkers = [];

    var circle ={
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: 'red',
        fillOpacity: .6,
        scale: 4.5,
        strokeColor: 'white',
        strokeWeight: 1
    };

    $.getJSON("data/mobieletoilettengentsefeesten.geojson", function( toiletten ) {
        $.each(toiletten.coordinates, function(l, locatie){
            var wcMarker = new google.maps.Marker({
                position: {"lat": parseFloat(locatie[1]), "lng": parseFloat(locatie[0])},    //coördinaten staan omgekeerd in geojson file
                map: googleMap,
                title: "WC",
                icon: circle
            })
            wcMarkers.push(wcMarker)
        });
    });
    return wcMarkers;
}

function unmarkWC(wcMarkers){
    for (var i = 0; i < wcMarkers.length; i++ ) {
        wcMarkers[i].setMap(null);
    }
    wcMarkers.length = 0;
}