// Initialize and add the map
function initMap() {
    // The location of Uluru
    const position = { lat: 18.7942069986723, lng: 98.98497741284065 };
    // The map, centered at Uluru
    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 15,
      center: position,
    });
    // The marker, positioned at Uluru
    const marker = new google.maps.Marker({
      position: uluru,
      map: map,
    });
  }
  
  window.initMap = initMap;