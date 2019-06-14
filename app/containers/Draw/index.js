import React from 'react';
import config from 'config';
import { Dropdown, MenuItem, Modal } from 'react-bootstrap';
import Navigation from 'components/Navigation';
import SettingControl from 'components/SettingControl';
import Footer from 'components/Footer';
import { fabric } from 'fabric';

export default class Draw extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      levelsList: [],
      allZonesList: {},
      selectedLevel: {},
      currentZonesList: [],
      selectedZone: {},
      draw: false,
      canvas: null,
      lineCounter: 0,
      roofPoints: [],
      drawedZones: [],
      save: true
    }
  }

  componentDidMount() {
    let canvas = new fabric.Canvas('canvas');
    fabric.Object.prototype.transparentCorners = false;

    let makeRoof = (roofPoints) => {
      let left = findLeftPaddingForRoof(roofPoints);
      let top = findTopPaddingForRoof(roofPoints);
      let index = roofPoints.length - 1;
      roofPoints.splice(index, 1);
      let roof = new fabric.Polyline(roofPoints, {
        fill: 'rgba(49,55,58,0.5)',
        stroke: 'rgba(49,55,58,1)',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center'
      });
      roof.set({
        left: left,
        top: top,
      });
      let tag = new fabric.Rect({
        width: 75, height: 25,
        rx: 15,
        ry: 15,
        stroke: 'rgba(0,0,0,0)',
        fill: 'rgba(49,55,58)',
        originX: 'center',
        originY: 'center'
      });
      tag.set({
        left: left,
        top: top,
      })
      let string = '';
      let zone = this.state.selectedZone;
      if (zone.name.length > 10) {
        string = zone.name.substr(0, 7) + '...';
      }
      else {
        string = zone.name;
      }
      let name = new fabric.Text(string, {
        fontSize: 15,
        fontFamily: 'HelveticaNeue',
        fontWeight: 'bold',
        fill: 'white',
        originX: 'center',
        originY: 'center'
      });
      name.set({
        left: left,
        top: top,
      })
      let group = new fabric.Group([roof, tag, name], {
        left: left,
        top: top,
      });
      group.hasBorders = false;
      group.hasControls = false;
      group.toObject = (function (toObject) {
        return function () {
          return fabric.util.object.extend(toObject.call(this), {
            zone_id: this.zone_id
          });
        };
      })(group.toObject);
      group.zone_id = this.state.selectedZone.id;
      return group;
    };
    let findTopPaddingForRoof = (roofPoints) => {
      let result = 999999;
      for (let f = 0; f < this.state.lineCounter; f++) {
        if (roofPoints[f].y < result) {
          result = roofPoints[f].y;
        }
      }
      return Math.abs(result);
    };
    let findLeftPaddingForRoof = (roofPoints) => {
      let result = 999999;
      for (let i = 0; i < this.state.lineCounter; i++) {
        if (roofPoints[i].x < result) {
          result = roofPoints[i].x;
        }
      }
      return Math.abs(result);
    };
    canvas.on('mouse:dblclick', (o) => {
      if (this.state.roofPoints.length > 0) {
        let roofPoints = this.state.roofPoints;
        let obj = canvas.getObjects('line');
        for (let i in obj) {
          canvas.remove(obj[i]);
        }
        let roof = makeRoof(roofPoints);

        canvas.add(roof);
        canvas.renderAll();

        this.setState({
          roofPoints: [],
          lineCounter: 0,
          save: false
        });
      }
    });
    canvas.on('object:moving', (e) => {
      this.setState({ save: false });
      let obj = e.target;
      if (obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width) {
        return;
      }
      obj.setCoords();
      // top-left  corner
      if (obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0) {
        obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top);
        obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left);
      }
      // bot-right corner
      if (obj.getBoundingRect().top + obj.getBoundingRect().height > obj.canvas.height || obj.getBoundingRect().left + obj.getBoundingRect().width > obj.canvas.width) {
        obj.top = Math.min(obj.top, obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top);
        obj.left = Math.min(obj.left, obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left);
      }
    });

    this.setState({ canvas: canvas }, () => {
      this.getLevelList();
    });
  }

  handleImageChange = (e) => {
    let file = e.target.files[0];
    let reader = new FileReader();

    reader.onloadend = () => {
      let canvas = this.state.canvas;
      fabric.Image.fromURL(reader.result, function (img) {
        let hRatio = canvas.width / img.width;
        let vRatio = canvas.height / img.height;
        let ratio = Math.min(hRatio, vRatio);
        if (canvas.width < img.width) {
          ratio = Math.min(hRatio, vRatio) * 0.95;
        }

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          top: -((img.height * ratio) - canvas.height) / 2,
          left: -((img.width * ratio) - canvas.width) / 2,
          scaleX: ratio,
          scaleY: ratio,
        });
        canvas.renderAll();
      });
      this.setState({ save: false });
    };
    reader.readAsDataURL(file);
  }

  toDataURL = (url, callback) => {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var reader = new FileReader();
      reader.onloadend = function () {
        callback(reader.result);
      }
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  checkDraw = () => {
    let array = this.state.drawedZones;
    let current_zone = this.state.selectedZone;
    let i = 0;
    array.push(current_zone);
    this.setState({
      // drawedZones: array,
      draw: true
    }, () => {
      this.draw();
    });
    // if (array.length === 0) {
    //   array.push(current_zone);
    //   this.setState({
    //     drawedZones: array,
    //     draw: true
    //   }, () => {
    //     this.draw();
    //   });
    // }
    // else {
    //   array.forEach((zone, index) => {
    //     if (zone.id === current_zone.id) {
    //       alert('This zone was already drawed. Delete it for new drawing');
    //       return;
    //     }
    //     else if (i == array.length - 1) {
    //       array.push(current_zone);
    //       this.setState({
    //         drawedZones: array,
    //         draw: true
    //       }, () => {
    //         this.draw();
    //       });
    //     }
    //     i++;
    //   })
    // }

  }

  drawFloorPlan = () => {
    let level = this.state.selectedLevel;
    let canvas = this.state.canvas;
    let temp = JSON.stringify(level.outline);
    canvas.loadFromDatalessJSON(temp, () => {
      let objects = canvas.getObjects();
      objects.forEach((object, index) => {
        let id = object.zone_id;
        object.toObject = (function (toObject) {
          return function () {
            return fabric.util.object.extend(toObject.call(this), {
              zone_id: this.zone_id
            });
          };
        })(object.toObject);
        object.zone_id = id;
      });
    });
  }

  getLevelList = () => {
    const requestUrl = config.serverUrl + config.api.zonemapping_levels;
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
        if (Array.isArray(res) && res.length > 0) {
          this.setState({
            levelsList: res,
            selectedLevel: res[0],
            selectedZone: res[0].zones[0],
            currentZonesList: res[0].zones.slice(0),
          }, () => {
            let canvas = this.state.canvas;
            canvas.clear();
            if (res[0].outline != null) {
              this.drawFloorPlan();
              this.setState({ drawedZones: res[0].zones.slice(0) });
            }
            else {
              this.toDataURL('./floor_plan.png', (dataUrl) => {
                canvas.setBackgroundImage(dataUrl, canvas.renderAll.bind(canvas), {});
              });
              this.setState({ drawedZones: [] });
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  selectLevel = (level) => {
    if (this.state.save == false) {
      if (confirm('Your changes will not be saved. Do you want to continue ?')) {
        this.setState({ save: true });
        if (level) {
          let zone = {};
          if (level.zones.length > 0) {
            zone = level.zones[0];
          }
          this.setState({
            selectedLevel: level,
            currentZonesList: level.zones.slice(0),
            selectedZone: zone,
            draw: false
          }, () => {
            let canvas = this.state.canvas;
            canvas.clear();
            if (level.outline != null) {
              this.drawFloorPlan();
              this.setState({ drawedZones: level.zones.slice(0) });
            }
            else {
              this.toDataURL('./floor_plan.png', (dataUrl) => {
                canvas.setBackgroundImage(dataUrl, canvas.renderAll.bind(canvas), {});
              });
              this.setState({ drawedZones: [] });
            }
          });
        }
      }
    }
    else {
      this.setState({ save: true });
      if (level) {
        let zone = {};
        if (level.zones.length > 0) {
          zone = level.zones[0];
        }
        this.setState({
          selectedLevel: level,
          currentZonesList: level.zones.slice(0),
          selectedZone: zone,
          draw: false
        }, () => {
          let canvas = this.state.canvas;
          canvas.clear();
          if (level.outline != null) {
            this.drawFloorPlan();
            this.setState({ drawedZones: level.zones.slice(0) });
          }
          else {
            this.toDataURL('./floor_plan.png', (dataUrl) => {
              canvas.setBackgroundImage(dataUrl, canvas.renderAll.bind(canvas), {});
            });
            this.setState({ drawedZones: [] });
          }
        });
      }
    }

  }

  select = (eventKey) => {
    if (eventKey.parent == 'zone') {
      this.setState({ selectedZone: eventKey.zone });
    }
  }

  draw = () => {
    let canvas = this.state.canvas;
    let lines = [];
    let lineCounter = 0;
    let line, isDown = false;
    let roofPoints = [];

    canvas.on('mouse:dblclick', () => {
      isDown = false;
      lines = [];
      lineCounter = 0;
      roofPoints = [];
      this.setState({ draw: false });
    });

    canvas.on('mouse:down', (o) => {
      if (this.state.draw == true) {
        if (isDown != true) isDown = true;
        let pointer = canvas.getPointer(o.e);
        roofPoints.push({ x: pointer.x, y: pointer.y });
        this.setState({ roofPoints: roofPoints });
        let points = [pointer.x, pointer.y, pointer.x, pointer.y];
        line = new fabric.Line(points, {
          strokeWidth: 3,
          selectable: false,
          stroke: 'red',
        });
        lines.push(line);
        canvas.add(lines[lineCounter]);
        lineCounter++;
        this.setState({
          lineCounter: lineCounter,
        });
        canvas.on('mouse:up', (options) => {
          canvas.selection = true;
        });
      }
    });
    canvas.on('mouse:move', (o) => {
      if (this.state.draw == true) {
        if (!isDown) return;
        let pointer = canvas.getPointer(o.e);
        lines[lineCounter - 1].set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
      }
    });

  }

  deleteDrewItem = () => {
    let canvas = this.state.canvas;
    if (canvas.getActiveObject()) {
      let zonesList = this.state.drawedZones;
      let obj = canvas.getActiveObject();
      let zone_id = obj.zone_id;
      zonesList.forEach((zone, index) => {
        if (zone.id === zone_id) {
          zonesList.splice(index, 1);
          canvas.remove(obj);
          this.setState({ drawedZones: zonesList, save: false });
        }
      });

    }
  }

  saveDraw = () => {
    // let array = this.state.drawedZones;
    // let zonesList = this.state.selectedLevel.zones;

    let map = this.state.canvas.toDatalessJSON();
    this.updateFloorMap(map);

    // if (array.length == zonesList.length) {

    // }
    // else {
    //   alert('There are ' + (zonesList.length - array.length).toString() + ' zones left !');
    // }
  }

  updateFloorMap = (map) => {
    const requestUrl = config.serverUrl + config.api.zonemapping_levels + '/' + this.state.selectedLevel.id;
    let status;
    let data = {
      outline: map
    };
    let cache = [];
    fetch(requestUrl, {
      method: 'PUT',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data, function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }),
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for (let key in res.errors) {
            let string = res.errors[key];
            array.push(string);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else {
          this.setState({
            drawedZones: [],
            save: true
          });
          let canvas = this.state.canvas;
          canvas.clear();
          this.getLevelList();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    return (
      <div className="draw">
        <Navigation {...this.props} />
        <SettingControl {...this.props} />
        <div className="draw container">
          <div className="sd-pseudo">
            <div className="row">
              <div className="col-md-4">
                <div className="level-list">
                  <ul>
                    {this.state.levelsList.map((item, index) => {
                      return (
                        <li key={index} className={this.state.selectedLevel.name == item.name ? 'active' : ''} onClick={this.selectLevel.bind(this, item)}><span>{item.name}</span><img src={this.state.selectedLevel.name == item.name ? './white-forward-arrow-ico.svg' : './grey-forward-arrow-ico.svg'} alt="" /></li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="col-md-6">
                <div className="dropdown-wrapper">
                  <div className="level-dropdown">
                    <Dropdown id="fl-level-dropdown">
                      <Dropdown.Toggle noCaret>
                        <table>
                          <tbody>
                            <tr>
                              <td className="lvl-name">{this.state.selectedLevel.name}</td>
                              <td rowSpan="2"><span className="pull-right"><i className="fa fa-caret-down" aria-hidden="true"></i></span></td>
                            </tr>
                            <tr>
                              <td className="lvl-position">{this.state.selectedZone ? this.state.selectedZone.name : ''}</td>
                            </tr>
                          </tbody>
                        </table>
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="super-colors">
                        {
                          this.state.currentZonesList.map((zone, index) => {
                            return (
                              <MenuItem key={index} eventKey={{ zone: zone, parent: 'zone' }} onSelect={this.select}>{zone.name}</MenuItem>
                            );
                          })}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                <div className="zone-map">
                  <canvas id="canvas" ref={el => this.myCanvas = el} width={700} height={370} />
                </div>
                <div className="buttons">
                  <div className="button-item">
                    <button type="button" className="btn btn-default btn-custom btn-draw" onClick={e => {
                      e.preventDefault();
                      if (this.state.selectedZone && this.state.selectedZone.name) {
                        this.checkDraw();
                      }
                      else {
                        alert('Zone must be selected before drawing');
                      }
                    }}>
                      <span>Draw</span>
                    </button>
                  </div>
                  <div className="button-item delete">
                    <button type="button" className="btn btn-default btn-custom btn-draw" onClick={this.deleteDrewItem}>
                      <span>Delete</span>
                    </button>
                  </div>
                  <div className="button-item upload">
                    <button type="button" className="btn btn-default btn-custom btn-draw" onClick={e => { this.refs.myUpload.click(); }}>
                      <span>Background</span>
                    </button>
                    <input ref="myUpload" type="file" onChange={this.handleImageChange} />
                  </div>
                  <div className="button-item save">
                    <button hidden={this.state.save} type="button" className="btn btn-default btn-custom btn-draw" onClick={e => {
                      e.preventDefault();
                      this.saveDraw();
                    }}>
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer {...this.props} />
      </div >
    );
  }
}