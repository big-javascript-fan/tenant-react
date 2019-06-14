import React from 'react';
import config from 'config';
import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';
import { signIn } from '../App/actions';
import uuidv1 from 'uuid';

export class SignIn extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      inputType: 'password',
      style: {}
    };
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

  componentDidMount(){
    this.getAssets();
  }

  getForeground = () => {
    let url = '';
    if(sessionStorage.getItem('foreground')){
      url = sessionStorage.getItem('foreground') + '?k=' + uuidv1();
    }
    else{
      url = './login-bg.png';
    }
    let style = {
      backgroundImage: "url(" + url + ")"
    };
    this.setState({ style: style });
  }

  getAssets = () => {
    let requestUrl = config.serverUrl + config.api.settings + '/assets';
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if(status == 200){
          if(res.foreground){
            sessionStorage.setItem('foreground', res.foreground);
          }
        }
        this.getForeground();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  changeValue = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if (key) {
      this.setState({ [key]: target.value });
    }
  }

  login = () => {
    if (this.state.username.length > 0 && this.state.password.length > 0) {
      const requestUrl = config.serverUrl + config.api.login;
      let status;
      const data = {
        username: this.state.username,
        password: this.state.password,
      };
      fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          status = response.status;
          return response.json();
        })
        .then((res) => {
          if(status === 200 && res.message === 'Login Success.' ){
            this.props.login();
            sessionStorage.setItem('token','Basic ' + btoa(data.username +':'+ data.password));
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('password', data.password);
            //this.props.history.push({pathname: '/navigation', state: {key: 'Navigation'}});
            this.getProfile();
          }
          else alert(res.error);
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      alert('Please enter all required fields');
    }
  }

  goToForgotPassword = (e) => {
    e.preventDefault();
    console.log('go here');
    this.props.history.push({
      pathname: '/forgot-password'
    });
  }

  goToZoneManagement = () => {
    if(sessionStorage.getItem('role') == 'ROLE_ADMIN'){
      this.props.history.push({pathname: '/floor-map', state: {key: 'Floor Map', activeTab: '1'}});
    }
    else if(sessionStorage.getItem('role') == 'ROLE_CLIENT'){
      //this.props.history.push({pathname: '/floor-map', state: {key: 'Floor Map', activeTab: '1'}});
      this.props.history.push({pathname: '/floor-plan', state: {key: 'Floor Plan', activeTab: '1', floor: this.state.Floor , companies: this.state.Companies}});
    }
    else{
      if(this.state.Floor){
        this.props.history.push({pathname: '/floor-plan', state: {key: 'Floor Plan', activeTab: '1', floor: this.state.Floor}});
      }
      else {
        alert('You do not have any permission to access this page');
      }
    }
  }

  getProfile = () => {
    let status;
    const requestUrl = config.serverUrl + config.api.users + '/me';
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      }
    })
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status === 200) {
          sessionStorage.setItem('role', res.role);
          this.setState({
            Fullname: res.firstname + ' ' + res.lastname,
            Role: res.role
          });
          if (res.role === 'ROLE_CLIENT') {
            this.getCompany(res.company.id);
          }
          else if (res.role === 'ROLE_USER') {
            if (res.permissions && res.permissions.levels) {
              this.setState({
                Floor: res.permissions.levels[0],
              });
              this.goToZoneManagement();
            }
          }
          else {
            this.goToZoneManagement();
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getCompany = (id) => {
    const params = {
      include_deleted: false,
    };
    const esc = encodeURIComponent
    const query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&')
    const requestUrl = config.serverUrl + config.api.companies_action + id + '?' + query;
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        return response.json();
        /* status = response.status;*/
      })
      .then((res) => {
        const array = [];
        array.push(res);
        if (!res.permissions.levels) {
          this.setState({
            Floor: null,
            Companies: array,
          });
        } else {
          const level = res.permissions.levels[0];
          this.setState({
            Floor: level,
            Companies: array,
          });
        }
      })
      .then(() => {
        this.goToZoneManagement();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleKey = (e) => {
    if(e.key == 'Enter'){
      this.login();
    }
  }

  render() {
    return (
      <div className="login" style={ this.state.style }>
        <div className="login-wrapper">
          <div className="lw-pseudo">
            <div className="lw-header">
              <img src="./white-logo.svg" alt="VAE Tenant Portal" />
              <h3>Sign In</h3>
              <p>Please fill out the form below to Sign In…</p>
            </div>
            <div className="lw-content">
              <form action="" method="POST" role="form">
                <div className="form-group">
                  <label htmlFor="">Username</label>
                  <table className="has-border">
                    <tbody>
                      <tr>
                        <td className="icon-left"><img className="d-block" src="./user-ico.svg" alt="user icon" /></td>
                        <td><input type="text" className="form-control username d-table-cell" id="username" data-state-key="username" value={this.state.username} onChange={this.changeValue} placeholder="" autoComplete="off" onKeyPress={this.handleKey}/></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="form-group">
                  <label htmlFor="">Password</label>
                  <table className="has-border">
                    <tbody>
                      <tr>
                        <td className="icon-left"><img className="d-block" src="./lock-ico.svg" alt="user icon" /></td>
                        <td><input type={this.state.inputType} className="form-control password" id="password" data-state-key="password" value={this.state.password} onChange={this.changeValue} placeholder="" autoComplete="off" onKeyPress={this.handleKey}/></td>
                        <td className="icon-right"><img className="d-block cursor-pointer" src="./eye-ico.svg" alt="user icon" onClick={this.togglePassword} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </form>
              <button type="submit" className="btn btn-primary btn-custom btn-login text-uppercase" onClick={this.login}>
                <table>
                  <tbody>
                    <tr>
                      <td>Login</td>
                      <td><img className="pull-right right-arrow" src="./white-right-arrow.svg" alt="white right arrow" /></td>
                    </tr>
                  </tbody>
                </table>
              </button>
            </div>
          </div>
        </div>
        <div className="other-action">
          <a href="#" onClick={this.goToForgotPassword}>Forgot your password?</a>
        </div>
      </div>
    );
  }
}

const mapStateToProps = createStructuredSelector({

});
export function mapDispatchToProps(dispatch) {
  return {
    login: (evt) => {
      if (evt !== undefined && evt.preventDefault) evt.preventDefault();
      dispatch(signIn());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SignIn);
