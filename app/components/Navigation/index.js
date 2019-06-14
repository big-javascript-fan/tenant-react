import React from 'react';
import config from 'config';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Dropdown, Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { logOut } from '../../containers/App/actions';
import uuidv1 from 'uuid';

export class Navigation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      Fullname: '',
      assets: {}
    };
  }

  goToZoneManagement = () => {
    if(sessionStorage.getItem('role') == 'ROLE_ADMIN'){
      this.props.history.push({pathname: '/floor-map', state: {key: 'Floor Map', activeTab: '1'}});
    }
    else if(sessionStorage.getItem('role') == 'ROLE_CLIENT'){
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

  goToSettings = () => {
    this.props.history.push({pathname: '/settings', state: {key: 'Settings', activeTab: '2', activeSettingTab: '1'}});
  }

  goToReport = () => {
    this.props.history.push({pathname: '/report', state: {key: 'Report', activeTab: '3'}});
  }

  goToProfile = () => {
    this.props.history.push({pathname: '/profile', state: {key: 'Profile', activeTab: '4'}});
  }

  logout = () => {
    const requestUrl = config.serverUrl + config.api.logout;
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if(status === 200 && res.message === 'Logout success.' ) {
          this.props.logout();
          sessionStorage.setItem('token', '');
          sessionStorage.setItem('role', '');
          this.props.history.push({pathname: '/', state: {key: 'Floor Map'}});
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  componentDidMount() {
    this.getProfile();
    this.getAssets();
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
        if(status == 200){
          sessionStorage.setItem('role', res.role);
          this.setState({
            Fullname: res.firstname + ' ' + res.lastname,
            Role: res.role
          });
          if(res.role == 'ROLE_CLIENT'){
            this.getCompany(res.company.id);
          }
          else if(res.role == 'ROLE_USER'){
            if(res.permissions && res.permissions.levels) {
              this.setState({
                Floor: res.permissions.levels[0],
              });
            }
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
        let array = new Array();
        array.push(res);
        let level = res.permissions.levels[0];
        this.setState({
          Floor: level,
          Companies: array
        });

      })
      .catch((error) => {
        console.log(error);
      });
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
          this.setState({assets: res});
          if(res.logo){
            sessionStorage.setItem('logo', res.logo);
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    let activeTab = null;

    if(this.props.location.state) {
      if(this.props.location.state.activeTab) {
        activeTab = this.props.location.state.activeTab;
      }
    } else {
      if(this.props.location.pathname) {
        let pathname = this.props.location.pathname.replace(/\/+/, '');
        switch (pathname) {
          case 'floor-map':
          case 'floor-plan':
            activeTab = '1';
            break;
          case 'settings':
          case 'zone-mapping':
          case 'global-settings':
          case 'admin-settings':
          case 'backup-restore':
          case 'device-configuration':
            activeTab = '2';
            break;
          case 'report':
            activeTab = '3';
            break;
          case 'profile':
            activeTab = '4';
            break;
        }
      }
    }

    return (
      <div className="navigation">
        <Navbar>
          <div className="row">
            <Navbar.Header>
              <Navbar.Toggle children={(<div><img src="./menu-ico.svg" alt="menu icon" /></div>)} />
            </Navbar.Header>
            <Navbar.Collapse>
              <ul className="nav navbar-nav custom">
                <li role="presentation"><a href="./"><img className="logo" src={sessionStorage.getItem('logo') ? sessionStorage.getItem('logo') + '?k=' + uuidv1() : './color-logo.svg'} alt="logo" /></a></li>
                <li role="presentation"><a className={activeTab == '1' ? 'active' : ''} onClick={this.goToZoneManagement}>Zone Management</a></li>
                <li role="presentation"><a className={activeTab == '2' ? 'active' : ''} onClick={this.goToSettings} hidden={sessionStorage.getItem('role') == 'ROLE_USER'}>Settings</a></li>
                <li role="presentation"><a className={activeTab == '3' ? 'active' : ''} onClick={this.goToReport} hidden={sessionStorage.getItem('role') == 'ROLE_USER'}>Report</a></li>
              </ul>
              <ul className="nav navbar-nav navbar-right">
                <Dropdown id="user-info-dropdown">
                  <Dropdown.Toggle>
                    <img src="./avatar.png" alt="avatar"/>
                    <span className="name">{this.state.Fullname}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="super-colors">
                    <MenuItem eventKey="1" onClick={this.goToProfile}>Profile</MenuItem>
                    <MenuItem divider />
                    <MenuItem eventKey="4" onClick={this.logout}>Logout</MenuItem>
                  </Dropdown.Menu>
                </Dropdown>
              </ul>
            </Navbar.Collapse>
          </div>
        </Navbar>
      </div>
    );
  }
}

const mapStateToProps = createStructuredSelector({

});
export function mapDispatchToProps(dispatch) {
  return {
    logout: (evt) => {
      if (evt !== undefined && evt.preventDefault) evt.preventDefault();
      dispatch(logOut());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Navigation);
