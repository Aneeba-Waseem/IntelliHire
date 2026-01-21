import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import './App.css'
import { BrowserRouter } from 'react-router-dom'
import store from "./features/auth/store"; // 👈 your Redux store file
import { Provider } from "react-redux"; // 👈 import Provider from react-redux
createRoot(document.getElementById('root')).render(
  <Provider store = {store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider >
)
