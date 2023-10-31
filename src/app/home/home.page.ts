import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  // Pega o elemento com ID map do HTML
  @ViewChild('map') mapRef!: ElementRef;

  // Cria a variavel do Maps
  map!: google.maps.Map;
  ListaEnderecos: google.maps.places.AutocompletePrediction[] = [];
  private autoComplete = new google.maps.places.AutocompleteService();
  private directions = new google.maps.DirectionsService();
  private directionsRender = new google.maps.DirectionsRenderer();

  minhaPosicao!: google.maps.LatLng;


  constructor(private ngZone: NgZone) { }

  async exibirMapa() {

    // The location of Uluru
    const position = { lat: -22.489201, lng: -48.546444 };

    // Request needed libraries.
    //@ts-ignore
    const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

    // The map, centered at Uluru
    this.map = new Map(
      this.mapRef.nativeElement,
      {
        zoom: 16,
        center: position,
        mapId: 'DEMO_MAP_ID',
      }
    );


    this.buscarPosicao();

  }

  ionViewWillEnter() {
    this.exibirMapa();
  }

  async buscarPosicao() {
    const coordinates = await Geolocation.getCurrentPosition();
    console.log('Current position:', coordinates);

      this.minhaPosicao = new google.maps.LatLng({
      lat: coordinates.coords.latitude,
      lng: coordinates.coords.longitude,
    });

    this.map.setCenter(this.minhaPosicao);
    this.map.setZoom(18);

    this.adicionarMarcador(this.minhaPosicao);

  }

  async adicionarMarcador(localizacao: google.maps.LatLng) {

    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

    //The marker, positioned at Uluru
    const marker = new AdvancedMarkerElement({
      map: this.map,
      position: localizacao,
      title: 'Posição',
    });

  }

  // Busca os endereços no MAPS
  buscarEndereco(valorBusca: any) {
    //Pega os dados digitados no campo de busca
    const busca = valorBusca.target.value as string;

    // Confere se ele não está vazio
    // Lembrando que 0 é igual a false
    if (!busca.trim().length) {
      this.ListaEnderecos = [];
      return false;
    }

    this.autoComplete.getPlacePredictions(
      { input: busca },
      (arrayLocais, status) => {
        if (status = 'ok') {
          this.ngZone.run(() => {
            this.ListaEnderecos = arrayLocais ? arrayLocais : [];
            console.log(this.ListaEnderecos);
          })
        } else {
          this.ListaEnderecos = [];
        }
      }
    );
    return true;
  }

  public tracarRota(local: google.maps.places.AutocompletePrediction) {
    this.ListaEnderecos = [];
    new google.maps.Geocoder().geocode({ address: local.description }, resultado => {
      const localizacao = resultado![0].geometry.location;
      this.adicionarMarcador(localizacao);

      const rota: google.maps.DirectionsRequest = {
        origin: this.minhaPosicao,
        destination: resultado![0].geometry.location,
        unitSystem: google.maps.UnitSystem.METRIC,
        travelMode: google.maps.TravelMode.DRIVING
      };

      this.directions.route(rota, (resultado, status) => {
        if (status == 'OK') {
          this.directionsRender.setMap(this.map);
          this.directionsRender.setOptions({ suppressMarkers: true });
          this.directionsRender.setDirections(resultado);
        }
      });
    });
  }
}
