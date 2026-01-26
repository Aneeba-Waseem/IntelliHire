import React from 'react'
import SidebarCustom from '../CommonComponents/SidebarCustom'
import MeetPreJoin from './MeetPreJoin'

const MeetingPermissions = () => {
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
            <MeetPreJoin/>
        </div>
        
      </div>

    </div>
  )
}

export default MeetingPermissions
