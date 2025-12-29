// import { API_URL } from '@/env';
// import axios from 'axios';

// /**
//  * apiClient
//  *
//  * This file defines a pre-configured axios instance that will be used
//  * throughout the application when making HTTP requests to the backend.
//  * Having a single place to configure the base URL and common headers makes
//  * it much easier to update the endpoint or customise behaviour (such as
//  * adding interceptors for authentication tokens) without touching every
//  * service.
//  */

// const apiClient = axios.create({
//   // NOTE: update this baseURL to match your deployed API. During
//   // development you can point to a local server or the IP provided
//   // by your backend team. For example, if your Swagger lives at
//   // http://50.16.93.238:3000/api as provided by the user, this baseURL
//   // should reflect that.  Keep the `/api` path so your service calls
//   // remain concise.
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Attach a request interceptor to automatically include an auth token
// // whenever it exists. This hook is optional and can be customised to
// // fetch the token from secure storage (e.g. AsyncStorage). See
// // contexts/AuthContext.tsx for where the token might be set.
// apiClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem('boskoToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default apiClient;