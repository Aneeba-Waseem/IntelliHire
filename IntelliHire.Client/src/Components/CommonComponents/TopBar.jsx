import React from 'react'
import SearchBar from './SearchBar'
import logo from '../../assets/landing/logo_final.png'
import Profile from './Profile'
import { useLocation } from 'react-router-dom'
const TopBar = () => {
  const location = useLocation()
  const Meeting = location.pathname === "/Meet";
  return (
<div className='bg-[#D1DED3] h-25 lg:h-20 flex flex-row justify-between items-center w-full overflow-y-hidden overflow-x-hidden px-5 md:px-10 '>
      <img src={logo} alt="IntelliHire" className='w-40 md:w-50 lg:w-60 mt-7 lg:mt-10' />
      {!Meeting && <SearchBar />}
      <Profile/>
    </div>
  )
}

export default TopBar