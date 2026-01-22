import React from 'react'
import SearchBar from './SearchBar'
import logo from '../../assets/logo_final.png'
import Profile from './Profile'

const TopBar = () => {
  return (
    <div className='h-17 lg:h-20 flex flex-row justify-between items-center min-w-screen px-5 md:px-10'>
      <img src={logo} alt="IntelliHire" className='w-40 md:w-50 lg:w-60 mt-7 lg:mt-10' />
      <SearchBar />
      <Profile/>
    </div>
  )
}

export default TopBar