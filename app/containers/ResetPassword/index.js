import React from 'react';
import config from 'config';

export default class ResetPassword extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      TokenKey: '',
      NewPassword: '',
      RepeatNewPassword: '',
      inputType: 'password'
    }
  }
  
  changeValue = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if (key) {
      this.setState({ [key]: target.value });
    }
  }
  
  togglePassword = () => {
    let inputType = this.state.inputType;
    if (inputType.toLowerCase() == 'password') {
      inputType = 'text';
    } else {
      inputType = 'password';
    }
    this.setState({ inputType });
  }
  
  ResetPassword = () => {
    if(this.state.NewPassword != '' && this.state.RepeatNewPassword != ''  && this.state.NewPassword == this.state.RepeatNewPassword && this.state.TokenKey != ''){
      const params = {
        token: this.state.TokenKey,
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      const requestUrl = config.serverUrl + config.api.users + '/reset_password/' + query;
      let status;
      const data = {
        new_password: this.state.NewPassword,
        repeat_new_password: this.state.RepeatNewPassword
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
        })
        .catch((error) => {
          console.log(error);
        });
    }
    else if (this.state.NewPassword != this.state.RepeatNewPassword){
      alert('Password must be match');
    }
    else {
      alert('Please fill all required');
    }
  }
  
  render () {
    return (
      <div className="reset-password">
        <div className="login-wrapper">
          <div className="lw-pseudo">
            <div className="lw-header">
              <img src="./white-logo.svg" alt="VAE Tenant Portal" />
              <h3>Reset Password</h3>
              <p>Please fill out the form below to Reset Password…</p>
            </div>
            <div className="lw-content">
              <form action="" method="POST" role="form">
                <div className="form-group">
                  <label htmlFor="">Token</label>
                  <table className="has-border">
                    <tbody>
                    <tr>
                      <td className="icon-left"><img className="d-block" src="./lock-ico.svg" alt="user icon" /></td>
                      <td><input type={this.state.inputType} className="form-control password" id="password" data-state-key="TokenKey" value={this.state.TokenKey} onChange={this.changeValue} placeholder="" autoComplete="off" /></td>
                      <td className="icon-right"><img className="d-block cursor-pointer" src="./eye-ico.svg" alt="user icon" onClick={this.togglePassword} /></td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <div className="form-group">
                  <label htmlFor="">New Password</label>
                  <table className="has-border">
                    <tbody>
                    <tr>
                      <td className="icon-left"><img className="d-block" src="./lock-ico.svg" alt="user icon" /></td>
                      <td><input type={this.state.inputType} className="form-control password" id="password" data-state-key="NewPassword" value={this.state.NewPassword} onChange={this.changeValue} placeholder="" autoComplete="off" /></td>
                      <td className="icon-right"><img className="d-block cursor-pointer" src="./eye-ico.svg" alt="user icon" onClick={this.togglePassword} /></td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <div className="form-group">
                  <label htmlFor="">Confirm New Password</label>
                  <table className="has-border">
                    <tbody>
                    <tr>
                      <td className="icon-left"><img className="d-block" src="./lock-ico.svg" alt="user icon" /></td>
                      <td><input type={this.state.inputType} className="form-control password" id="password" data-state-key="RepeatNewPassword" value={this.state.RepeatNewPassword} onChange={this.changeValue} placeholder="" autoComplete="off" /></td>
                      <td className="icon-right"><img className="d-block cursor-pointer" src="./eye-ico.svg" alt="user icon" onClick={this.togglePassword} /></td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </form>
              <button type="submit" className="btn btn-primary btn-custom btn-login text-uppercase" onClick={this.ResetPassword}>
                <table>
                  <tbody>
                  <tr>
                    <td>Reset Password</td>
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