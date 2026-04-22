import React from 'react'
import TopBar from './TopBar'
import SidebarCustom from './SidebarCustom'

const CommonPage = () => {
  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden ">

      {/* Left Sidebar (10%) */}
      <div className="w-[10%] min-w-[80px] flex items-around justify-center">
        <SidebarCustom />
      </div>

      {/* Right Side (90%) split into two equal parts) */}
      <div className="w-[90%] min-w-[80px] flex items-around justify-center">

        {/* left one  */}
        <div className="w-full bg-[#45767C] flex items-around justify-center">
        </div>

        {/* Right one
        <div className="w-[50%]  bg-black flex items-around justify-center">
        </div> */}


      </div>

    </div>
  )
}

export default CommonPage
