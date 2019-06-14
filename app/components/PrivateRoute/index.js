import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { getLoginState, makeSelectCurrentUser } from '../../containers/App/selectors';

export class PrivateRoute extends React.Component {
  render() {
    const {path, component} = this.props;
    const token = sessionStorage.getItem('token');
    return (
      (token !== '' && token !== null)
      ? <Route path={path} component={component} />
        :<Redirect to="/" />
    );
  }
}

const mapStateToProps = createStructuredSelector({
  redirectToReferrer: getLoginState(),
  currentUser: makeSelectCurrentUser()
});

export function mapDispatchToProps(dispatch) {
  return {
  
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PrivateRoute);

