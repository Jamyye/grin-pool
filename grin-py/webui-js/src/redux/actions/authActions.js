// @flow
/* global document sessionStorage */
import { API_URL } from '../../config.js'
import FormData from 'form-data'
import { type Dispatch, type GetState } from '../types.js'

export const attemptAutoLoginFromCookies = () => (dispatch: Dispatch, getState: GetState) => {
  const username = sessionStorage.getItem('username')
  const id = sessionStorage.getItem('id')
  const token = sessionStorage.getItem('token')
  const expiration = sessionStorage.getItem('expiration')
  const expirationTimestamp = parseInt(expiration)
  const currentTimestamp = new Date().getTime() / 1000
  if (expirationTimestamp && expirationTimestamp > currentTimestamp) {
    dispatch({ type: 'ACCOUNT', data: { username, token, id } })
  } else {
    dispatch(logout())
  }
}

export const createUser = (username: string, password: string, history: any) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'IS_CREATING_ACCOUNT', data: true })
  try {
    const url = `${API_URL}pool/users`
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    const createUserResponse = await fetch(url, {
      method: 'POST',
      body: formData
    })
    const createUserData = await createUserResponse.json()
    if (createUserData.username) {
      const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
      const url = `${API_URL}pool/users`
      const loginResponse = await fetch(url, {
        headers: {
          'Authorization': auth
        },
        method: 'GET'
      })
      const loginData = await loginResponse.json()
      dispatch({ type: 'ACCOUNT', data: { username, token: loginData.token, id: loginData.id } })
      sessionStorage.setItem('username', username)
      sessionStorage.setItem('id', loginData.id)
      sessionStorage.setItem('token', loginData.token)
      const currentTimestamp = new Date().getTime()
      sessionStorage.setItem('expiration', (currentTimestamp / 1000 + 86400).toString())
      history.push('/miner')
    } else if (createUserData.message) {
      dispatch({ type: 'AUTH_ERROR', data: { authError: createUserData.message } })
    }
  } catch (e) {
    console.log('Error: ', e)
    dispatch({ type: 'AUTH_ERROR', data: { authError: e.message } })
  }
}

export const login = (username: string, password: string, history: Object) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'IS_LOGGING_IN', data: true })
  try {
    const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
    const url = `${API_URL}pool/users`
    const loginResponse = await fetch(url, {
      headers: {
        'Authorization': auth
      },
      method: 'GET'
    })
    const loginData = await loginResponse.json()
    dispatch({ type: 'ACCOUNT', data: { username, id: loginData.id, token: loginData.token } })
    sessionStorage.setItem('username', username)
    sessionStorage.setItem('id', loginData.id)
    sessionStorage.setItem('token', loginData.token)
    const currentTimestamp = new Date().getTime()
    const currentTimestampFixed = currentTimestamp / 1000
    const futureTimestamp = (currentTimestampFixed + 86400).toString()
    sessionStorage.setItem('expiration', futureTimestamp)
    history.push('/miner')
  } catch (e) {
    console.log('Error: ', e)
    dispatch({ type: 'AUTH_ERROR', data: { authError: 'There was a problem logging in with those credentials. Please check your credentials and try again.' } })
  }
}

export const logout = () => (dispatch: Dispatch, getState: GetState) => {
  dispatch({
    type: 'ACCOUNT',
    data: null
  })
  sessionStorage.clear()
}
