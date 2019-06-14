/*
 * AppReducer
 *
 * The reducer takes care of our data. Using actions, we can change our
 * application state.
 * To add a new action, add it to the switch statement in the reducer function
 *
 * Example:
 * case YOUR_ACTION_CONSTANT:
 *   return state.set('yourStateVariable', true);
 */

import { fromJS } from 'immutable';

import {
  LOAD_REPOS_SUCCESS,
  LOAD_REPOS,
  LOAD_REPOS_ERROR,
  LOAD_FEATURES_SUCCESS,
  LOAD_FEATURES,
  LOAD_FEATURES_ERROR,
  SIGN_IN,
  LOG_OUT,
} from './constants';

// The initial state of the App
export const initialState = fromJS({
  loading: false,
  error: false,
  currentUser: false,
  userData: {
    repositories: false,
  },
  redirectToReferrer: false,
});

function appReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_REPOS:
      return state
        .set('loading', true)
        .set('error', false)
        .setIn(['userData', 'repositories'], false);
    case LOAD_REPOS_SUCCESS:
      return state
        .setIn(['userData', 'repositories'], action.repos)
        .set('loading', false)
        .set('currentUser', action.username);
    case LOAD_REPOS_ERROR:
      return state
        .set('error', action.error)
        .set('loading', false);
    case LOAD_FEATURES:
      return state
        .set('loading', true)
        .set('error', false)
        .setIn(['features'], false);
    case LOAD_FEATURES_SUCCESS:
      return state
        .setIn(['features'], action.features)
        .set('loading', false);
    case LOAD_FEATURES_ERROR:
      return state
        .set('error', action.error)
        .set('loading', false);
    case SIGN_IN:
      return state
        .set('redirectToReferrer', true);
    case LOG_OUT:
      return state
        .set('redirectToReferrer', false);
    default:
      return state;
  }
}

export default appReducer;
