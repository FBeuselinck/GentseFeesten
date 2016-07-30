//http://datatank.stad.gent/4/toerisme/gentsefeestenevents.json

var url = "http://datatank.stad.gent/4/toerisme/gentsefeestenevents.json";

$.getJSON("data/testEvents.json", function( data ) {
    var uniqueData = filterData(data);
    //d3SimpleTable(uniqueData);
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
    $("#detail").empty();
    $("#detail").append(
        $("<h1>" + event.titel + "</h1>")
    ).append(
        $("<ul>").append(
            $("<li>" + "Omschrijving: " + event.omschrijving + "</li>")
        ).append(
            $("<li>" + "Organisatie: " + event.organisatie + "</li>")
        ).append(
            $("<li>...</li>")
        )
    );
    createMap(event);
    $("html, body").scrollTop($("#detail").offset().top);
}

function createMap(event){
    var map = initMap(map, event);

    /*
    //mobiele toiletten tonen op map:
    map.data.loadGeoJson('https://storage.googleapis.com/mapsdevsite/json/google.json');
    var ctaLayer = new google.maps.KmlLayer({
        url: 'http://datatank.stad.gent/4/toerisme/mobieletoilettengentsefeesten.kml',
        map: map
    });
    */
}

function initMap(map, event) {
    var locatie = {"lat": parseFloat(event.latitude),"lng": parseFloat(event.longitude)};
    map = new google.maps.Map(document.getElementById("map-canvas"), {
        center: locatie,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var marker = new google.maps.Marker({
        position: locatie,
        map: map,
        title: event.titel
    });

    return map;
}
