import React, {Component} from 'react';
import {render} from 'react-dom';
import io from 'socket.io-client';

class Root extends Component {
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
    const SHAKE_THRESHOLD = 5000;
    let last_update = 0;
    let last_x, last_y, last_z;

    return (eventData) => {
      const curTime = new Date().getTime();
      if ((curTime - last_update) > 100) {
        const diffTime = curTime - last_update;
        last_update = curTime;
        const {x, y, z} = eventData.accelerationIncludingGravity;
        const speed = Math.abs(x + y + z - last_x - last_y - last_z) / diffTime * 10000;
        [last_x, last_y, last_z] = [x, y, z];
        if (speed > SHAKE_THRESHOLD) {
          this.socket.emit('shaked');
          this.setState({
            count: this.state.count + 1
          });
        }
      }
    };
  }

  onNameChange = (e) => {
    const value = e.target.value;
    if (/^\S*$/.test(value)) {
      this.setState({
        name: e.target.value
      });
    }
  };

  onJoinClick = (e) => {
    e.preventDefault();
    this.socket.emit('join', {name: this.state.name});
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
          <input name="name" value={this.state.name} onChange={this.onNameChange} />
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

render(<Root />, document.getElementById('root'));
