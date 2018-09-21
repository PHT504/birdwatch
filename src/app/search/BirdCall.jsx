import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { FlatButton, Dialog, TextField } from 'material-ui/';
import Header from '../Header.jsx';
import Footer from '../timeline/Footer.jsx';
import BirdCallInfo from './BirdCallInfo.jsx';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

class SimpleForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      input: '',
      open: false,
      data: [{
        descript: '',
        imgs: 'yuiopoiuy',
        sciName: '',
        audio: '',
      }],
    };
    // this.onChange = input => this.setState({ input });
    this.handleChange = this.handleChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
  }
  handleOpen(info) {
    this.setState({ open: true });
    this.setState({ data: info });
  }
  handleClose() {
    this.setState({ open: false });
  }

  
  handleFormSubmit(event) {
    event.preventDefault();
    /*
    send a post to /search route so that it returns an object 
    with a photo a sound clip and a short description

    */
    console.log(this.state.input);
    axios.post('/search', {
      search: this.state.input,
    }).then(({ data }) => {
      if (data) {
        this.handleOpen([data]);
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  handleChange(event) {
    this.setState({ input: event.target.value });
  }

  render() {
    const actions = [
      <FlatButton
        key={1}
        type="reset"
        label="Close"
        style={{ float: 'left' }}
        onClick={this.handleClose}
      />,
    ];
    return (
      <div style={{ textAlign: 'center', padding: 8, margin: '24px -12px -12px -12px' }}>
        <MuiThemeProvider>
          <div>
            <Header />
            <form onSubmit={this.handleFormSubmit}>
              <TextField name="text" placeholder="search" value={this.state.value} onChange={this.handleChange} />
            </form>
            <Dialog open={this.state.open}>
              <BirdCallInfo props={this.state.data} />
              {actions}
            </Dialog>
            <Footer />
          </div>
        </MuiThemeProvider>
      </div>
    );
  }
}

SimpleForm.propType = {
  birdCatcher: PropTypes.func.isRequired,
};

export default SimpleForm;
