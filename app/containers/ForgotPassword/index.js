import React from 'react';
import config from 'config';

export default class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      Email: '',
    }
  }
  changeValue = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if (key) {
      this.setState({ [key]: target.value });
    }
  }
  sendEmail = () => {
    if(this.state.Email != ''){
      const requestUrl = config.serverUrl + config.api.users + '/forgot_password';
      let status;
      const data = {
        email: this.state.Email,
      };
      fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "accept": "application/json"
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          status = response.status;
          return response.json();
        })
        .then((res) => {
          if(status != 200){
            alert(res.message);
          }
          else {
            alert(res.message);
            this.props.history.push({pathname:'/reset-password'});
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
    else {
      alert('Email is required');
    }
  }
  
  render() {
    return (
      <div className="forgot-password">
        <div className="login-wrapper">
          <div className="lw-pseudo">
            <div className="lw-header">
              <img src="./white-logo.svg" alt="VAE Tenant Portal" />
              <h3>Forgot Password</h3>
              <p>Please fill your email into the form below to receive Reset password code…</p>
            </div>
            <div className="lw-content">
              <form action="" method="POST" role="form">
                <div className="form-group">
                  <label htmlFor="">Email</label>
                  <table className="has-border">
                    <tbody>
                    <tr>
                      <td className="icon-left"><img className="d-block" src="./envelope-3.svg" alt="mail icon" /></td>
                      <td><input className="form-control email d-table-cell" id="email" data-state-key="Email" value={this.state.Email} onChange={this.changeValue} /></td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </form>
              <button type="submit" className="btn btn-primary btn-custom btn-login text-uppercase" onClick={this.sendEmail}>
                <table>
                  <tbody>
                  <tr>
                    <td>Send request</td>
                    <td><img className="pull-right right-arrow" src="./white-right-arrow.svg" alt="white right arrow" /></td>
                  </tr>
                  </tbody>
                </table>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}