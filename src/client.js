import React, {Component} from 'react';
import {render} from 'react-dom';
import io from 'socket.io-client';

import './styles/client.css';

class Client extends Component {
  static defaultProps = {
    id: '',
    name: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      joined: false,
      started: false,
      count: 0,
      error: ''
    };
  }

  componentDidMount() {
    const socket = io.connect('/client');
    this.socket = socket;
    socket.on('connect', () => {
      this.socket.emit('join', {
        id: this.props.id,
        name: this.props.name
      });
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

    return (
      <div className="action">
        {this.state.error && (
          <div>{this.state.error}</div>
        )}
        {this.state.joined && !this.state.started && (
          <p>{this.props.name}加入成功，活动马上开始！<br />请关注<strong>美丽的主持人</strong>和大屏幕。</p>
        )}
        {this.state.joined && this.state.started && (
          <div>
            <p><strong>活动开始</strong>！摇起你的手机！</p>
            <div className="lu"><span>已摇</span>{this.state.count}<span>次</span></div>
          </div>
        )}
      </div>
    );
  }
}

render(<Client id={window.openId} name={window.nickname} />, document.getElementById('client'));
