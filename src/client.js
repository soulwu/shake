import 'babel-polyfill';
import React, {Component} from 'react';
import {render} from 'react-dom';
import io from 'socket.io-client';

class Client extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      joined: false,
      started: false,
      name: '',
      count: 0,
      error: ''
    };
  }

  componentDidMount() {
    const socket = io.connect('/client');
    this.socket = socket;
    socket.on('connect', () => {
      this.setState({
        connected: true
      });
    });
    socket.on('joined', (message) => {
      this.setState({
        joined: true,
        name: message.name
      });
    });
    socket.on('started', () => {
      this.setState({
        started: true
      });
    });
    socket.on('stoped', () => {
      this.setState({
        started: false
      });
    });
    socket.on('shaked', (message) => {
      this.setState({
        count: message.count
      });
    });
    socket.on('errored', (message) => {
      this.setState({
        error: message.error
      });
    });

    window.addEventListener('devicemotion', this.deviceMotion());
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  deviceMotion() {
    const speed = 25;
    let last_x = 0;
    let last_y = 0;
    let last_z = 0;

    return (eventData) => {
      const {x, y, z} = eventData.accelerationIncludingGravity;
      if (Math.abs(x - last_x) > speed || Math.abs(y - last_y) > speed || Math.abs(z - last_z) > speed) {
        this.socket.emit('shaked');
      }
      [last_x, last_y, last_z] = [x, y, z];
    };
  }

  onNameChange = (e) => {
    const value = e.target.value;
    this.setState({
      name: value.replace(/\s/g, '')
    });
  };

  onJoinClick = (e) => {
    e.preventDefault();
    if (this.refs.name.value) {
      this.socket.emit('join', {name: this.refs.name.value});
    }
  };

  render() {
    if (!window.DeviceMotionEvent || !this.state.connected) {
        return null;
    }

    if (!this.state.joined) {
      return (
        <div>
          {this.state.error && (<div>{this.state.error}</div>)}
          <label>请输入你的姓名</label>
          <input name="name" ref="name" />
          <button onClick={this.onJoinClick}>立即加入</button>
        </div>
      );
    }

    return (
      <div>
        {this.state.error && (<div>{this.state.error}</div>)}
        <div>{this.state.name}已加入</div>
        <div>当前计数：{this.state.count}</div>
      </div>
    );
  }
}

render(<Client />, document.getElementById('client'));
