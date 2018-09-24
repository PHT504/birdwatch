import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import SimpleForm from './Search.jsx';
// import exampleBirdData from '../data/exampledata.jsx';
import Header from '../Header.jsx';
import GMap from './GMap.jsx';
import ScrollToTop from 'react-scroll-up';
import LocationOn from 'material-ui/svg-icons/navigation/arrow-upward';
import axios from 'axios';
import _ from 'lodash';

const upIcon = <LocationOn />;

class MapContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      birdData: [],
      latLng: { lat: 29.95106579999999, lng: -90.0715323 },
    };
    this.getLatLng = this.getLatLng.bind(this);
    this.birdCatcher = this.birdCatcher.bind(this);
    this.eBird = this.eBird.bind(this);
    this.getMap = this.getMap.bind(this);
  }
  componentWillMount() {
    this.eBird();
    this.getMap();

  }
  getLatLng(data) {
    this.setState({ latLng: data });
  }
  birdCatcher(data) {
    data.push({ lat: 29.9934, lng: -90.0982, sciName: 'connor',comName: 'Black Vulture', locName: 'City Park, New Orleans, LA' });
    this.setState({ birdData: data });
  }
  /*
   set up a get request to add all of the ebird features so that when the map is rendering it displays all of the 
   sitings that are logged into ebird.
  */

  getMap() {
    axios.get('/map')
    .then(({ data }) => {
      const { bldata, locations, birds } = data;
      // console.log(bldata, locations, birds, _);
      const locs =_.flatten(locations);
      console.log(_.flatten(birds));
      const array = [];
      for(var i = 0; i < locs.length; i++) {
        array.push(locs[i]);
      }
      console.log(array);
      
    });
  }

  eBird() {
    axios.get('/eBird')
   .then(({ data }) => {
    console.log(data);
     this.birdCatcher(data);
   });
  }

  render() {
    return (
      <div>
        <MuiThemeProvider>
          <div>
            <Header />
            <SimpleForm birdCatcher={this.birdCatcher} getLatLng={this.getLatLng} />
            <br />
            <GMap google={window.google} birdData={this.state.birdData} latLng={this.state.latLng} />
            <br />
            <ScrollToTop
              showUnder={100}
              style={{
                position: 'fixed',
                bottom: 20,
                right: 'auto',
                left: 30,
                transitionDuration: '0.2s',
                transitionTimingFunction: 'linear',
                transitionDelay: '0s' }}
            >
              <span>{upIcon}</span>
            </ScrollToTop>
          </div>
        </MuiThemeProvider>
      </div>
    );
  }
}


export default MapContainer;
