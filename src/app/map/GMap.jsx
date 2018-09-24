import React, { Component } from 'react';
import Map, { Marker, InfoWindow } from 'google-maps-react';

import BirdLogo from '../../assets/images/cursorBW.png';
import Moment from 'moment-timezone';

class GMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      zoom: 12,
      showingInfoWindow: false,
      activeMarker: {},
      selectedPlace: {},
    };
    this.onMarkerClick = this.onMarkerClick.bind(this);
  }
  onMarkerClick(props, marker) {
    this.setState({
      selectedPlace: props,
      activeMarker: marker,
      showingInfoWindow: true,
    });
  }
  render() {
    return (
      <div>
        <Map
          google={this.props.google} 
          zoom={this.state.zoom}
          initialCenter={this.props.latLng}
          center={this.props.latLng}
        >
        {this.props.birdData.map((bird, i) => {  
          const { lat, lng } = bird;
          return (
            <Marker
              onClick={this.onMarkerClick}
              name={`${bird.comName}(${bird.howMany})`}
              date={`Last seen ${Moment(bird.obsDt).fromNow()}`}
              sciName={`Sci name: ${bird.sciName}`}
              loc={`Location: ${bird.locName}` }
              key={i}
              icon={BirdLogo}
              position={{ lat: lat, lng: lng }}
            />
          );
        })}

          <InfoWindow
            marker={this.state.activeMarker}
            visible={this.state.showingInfoWindow}
          >
            <div>
              <center><h2>{this.state.selectedPlace.name}</h2></center>
              <center><h4>{this.state.selectedPlace.sciName}</h4></center>
              <center><h4>{this.state.selectedPlace.loc}</h4></center>
              <center><h4>{this.state.selectedPlace.date}</h4></center>
            </div>
          </InfoWindow>
        </Map>
      </div>
    );
  }
}

export default GMap;
// center={this.props.latLng}