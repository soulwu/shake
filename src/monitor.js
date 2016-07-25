import React, {Component} from 'react';
import {render} from 'react-dom';
import io from 'socket.io-client';
import _ from 'lodash';

import './styles/monitor.css';

class Monitor extends Component {
  static displayName = 'Monitor';

  constructor(props) {
    super(props);
    this.state = {
      online: 0,
      started: false,
      countDown: 0,
      leftTime: 0,
      scores: []
    };
  }

  componentDidMount() {
    const socket = io.connect('/monitor');

    socket.on('sync', (message) => {
      const scores = _.reverse(_.sortBy(message.scores, 'count'));
      this.setState({
        online: message.online,
        started: message.started,
        scores
      });
    });

    this.socket = socket;
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  startCountDown() {
    this.setState({
      countDown: 3
    });
    let interval = setInterval(() => {
      const countDown = this.state.countDown - 1;
      if (countDown === 0) {
        clearInterval(interval);
        interval = null;
        this.socket.emit('start');
        this.shakingCountDown();
      }
      this.setState({
        countDown
      });
    }, 1000);
  }

  shakingCountDown() {
    this.setState({
      leftTime: 300
    });

    let interval = setInterval(() => {
      const leftTime = this.state.leftTime - 1;
      if (leftTime === 0) {
        clearInterval(interval);
        interval = null;
        this.socket.emit('stop');
      }
      this.setState({
        leftTime
      });
    }, 100);
  }

  onStartClick = (e) => {
    e.preventDefault();
    this.startCountDown();
  };

  onResetClick = (e) => {
    e.preventDefault();
    this.socket.emit('reset');
  };

  renderTopThree() {
    const [first = {}, second = {}, third = {}] = this.state.scores;
    return (
      <div className="top_rank">
        <div className="top">
          <p className="rank">第一名</p>
          <p className="name">{first.name}</p>
          <p className="lu">{first.count}</p>
        </div>
        <div className="top">
          <p className="rank">第二名</p>
          <p className="name">{second.name}</p>
          <p className="lu">{second.count}</p>
        </div>
        <div className="top">
          <p className="rank">第三名</p>
          <p className="name">{third.name}</p>
          <p className="lu">{third.count}</p>
        </div>
      </div>
    );
  }

  renderRest() {
    const rest = [];
    const scores = this.state.scores.slice(3);
    let i = 0;
    for (const score of scores) {
      i++;
      const item = (
        <li key={i}>
          <p>{score.name}</p>
          <p>{score.count}</p>
        </li>
      );
      rest.push(item);
    }

    return (
      <ul>
        {rest}
      </ul>
    );
  }

  render() {
    return (
      <div className="content">
        <div className="on">
          <p>在线人数</p>
          <strong>{this.state.online}</strong>
        </div>
        {this.renderTopThree()}
        {this.renderRest()}
        {!this.state.started && this.state.countDown === 0 && this.state.scores.length === 0 && (
          <button className="btn" type="button" onClick={this.onStartClick}>开始</button>
        )}
        {!this.state.started && this.state.countDown > 0 && (
          <button className="btn" type="button">{this.state.countDown}秒后开始</button>
        )}
        {this.state.started && this.state.leftTime > 0 && (
          <button className="btn" type="button">还剩{(this.state.leftTime / 10).toFixed(1)}秒</button>
        )}
        {!this.state.started && this.state.scores.length > 0 && (
          <button className="btn" type="button" onClick={this.onResetClick}>重置</button>
        )}
      </div>
    );
  }
}

render(<Monitor />, document.getElementById('monitor'));
