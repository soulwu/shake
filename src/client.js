import React, {Component, PropTypes} from 'react';
import {render} from 'react-dom';
import io from 'socket.io-client';

import './styles/client.css';

class Client extends Component {
  static displayName = 'Client';

  static propTypes = {
    id: PropTypes.string,
    name: PropTypes.string
  };

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
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;

    return (eventData) => {
      const {x, y, z} = eventData.accelerationIncludingGravity;
      if (Math.abs(x - lastX) > speed || Math.abs(y - lastY) > speed || Math.abs(z - lastZ) > speed) {
        this.socket.emit('shaked');
      }
      [lastX, lastY, lastZ] = [x, y, z];
    };
  }

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
          <p>[{this.props.name}] 加入成功，活动马上开始！<br />请关注<strong>今夏依然美丽的主持人</strong>和大屏幕。</p>
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
