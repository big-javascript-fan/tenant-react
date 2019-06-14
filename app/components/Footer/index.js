import React from 'react';

export default class Footer extends React.Component {
  render() {
    return (
      <div className="footer">
        <div className="col-md-6 col-md-offset-3">
          <table>
            <tbody>
              <tr>
                <td><img src="./grey-logo.svg" alt="logo"/></td>
                <td><span>Copyright VAE Group 2018</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}