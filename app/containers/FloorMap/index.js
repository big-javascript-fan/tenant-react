import React from 'react';
import config from 'config';
import { Dropdown, MenuItem } from 'react-bootstrap';
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';
import uuidv1 from 'uuid';
import Spin from 'antd/lib/spin';

export default class FloorMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      companiesList: [],
      levelsList: [],
      settingList: {},
      loading: true,
    };
  }
  goToFloorPlan = (item) => {
    let companies = [];
    this.state.companiesList.map((company, index) => {
      let permission = company.permissions.levels;
      for (let num in permission) {
        if (permission[num].id == item.id) {
          let zonesList = permission[num].zones;
          let temp = {
            id: company.id,
            title: company.title,
            address: company.address,
            deleted_at: company.deleted_at,
            email: company.email,
            firstname: company.firstname,
            lastname: company.lastname,
            note: company.note,
            role: company.role,
            username: company.username,
            zones: zonesList,
          };
          companies.push(temp);
        }
      }
    });
    this.props.history.push({ pathname: '/floor-plan', state: { key: 'Floor Plan', activeTab: '1', floor: item, companies: companies } });
  };

  componentDidMount() {
    this.getFloorMap();
  }

  getFloorMap = () => {
    this.setState({ loading: true });
    const params = {
      include_deleted: false,
    };
    const esc = encodeURIComponent
    const query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&')
    const requestUrl_1 = config.serverUrl + config.api.companies_list + '?' + query;
    let status;
    fetch(requestUrl_1, {
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
        if (Array.isArray(res) && res.length > 0) {
          this.setState({ companiesList: res });
        }
      })
      .catch((error) => {
        console.log(error);
      });

    const requestUrl_2 = config.serverUrl + config.api.zonemapping_levels;
    fetch(requestUrl_2, {
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
        if (Array.isArray(res) && res.length > 0) {
          this.setState({
            levelsList: res,
          }, () => this.setState({ loading: false }));
        }
      })
      .catch((error) => {
        console.log(error);
      });
    const requestUrl = config.serverUrl + config.api.settings;
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
        if (Object.keys(res).length) {
          this.setState({
            settingList: res,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {

    const floorList = this.state.levelsList.map((item, index) => {
      let i = 0;
      let value = item.name.split(' ');
      return (
        <div key={index} className="floor-item col-md-6">
          <div className="fi-pseudo" onClick={e => {
            e.preventDefault();
            this.goToFloorPlan(item);
          }}>
            <table className="first">
              <tbody>
                <tr>
                  <td className="fi-text" width="80%">Tenants</td>
                  <td className="fi-level" rowSpan="3" width="20%"><label>Level</label><span>{value[1]}</span></td>
                </tr>
                <tr>
                  <td className="fi-tenant-logos">
                    <div className="row">
                      {
                        this.state.companiesList.map((company) => {
                          if (company.permissions.levels) {
                            let permission = company.permissions.levels;
                            for (let num in permission) {
                              if (permission[num].id == item.id) {
                                return (
                                  <div key={company.id} className="fitl-position col-xs-2">
                                    {
                                      company.logo ? <img src={company.logo} alt="tenant avatar" /> : (<div className="default-logo"><span>{company.username.charAt(0).toUpperCase()}</span></div>)
                                    }
                                  </div>
                                );
                              }
                            }
                          }
                        })
                      }
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="fi-floor-plan">
                      <table className="second">
                        <tbody>
                          <tr>
                            <td><span>Show floor plan</span></td>
                            <td className="pull-right right-arrow"><img src="./grey-right-arrow.svg" alt="grey right arrow" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    });
    return (
      <div className="floor-map">
        <Navigation {...this.props} />
        <div className="locations">
          <div className="container">
            <Dropdown id="fm-locations-dropdown">
              <Dropdown.Toggle noCaret>
                <table>
                  <tbody>
                    <tr>
                      <td className="lc-image" rowSpan="2"><img src="./location-image.png" alt="avatar" /></td>
                      <td className="lc-name">{this.state.settingList.Building}</td>
                      <td rowSpan="2"><span className="pull-right"><i className="fa fa-caret-down" aria-hidden="true"></i></span></td>
                    </tr>
                    <tr>
                      <td className="lc-address">{this.state.settingList.Address}, {this.state.settingList.Suburb} {this.state.settingList.City}</td>
                    </tr>
                  </tbody>
                </table>
              </Dropdown.Toggle>
              <Dropdown.Menu className="super-colors">
                <MenuItem eventKey="1">Street: {this.state.settingList.Address}</MenuItem>
                <MenuItem eventKey="1">Suburb: {this.state.settingList.Suburb}</MenuItem>
                <MenuItem eventKey="2">City: {this.state.settingList.City}</MenuItem>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        <div className="floors">
          <div className="container">
            <div className="row">
              <Spin spinning={this.state.loading}>
                {floorList}
              </Spin>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}