import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className='w-screen h-screen bg-amber-100 flex justify-center items-center'><Link className='w-fit h-fit p-4 bg-blue-500 rounded-full font-bold text-2xl hover:bg-blue-700 duration-300 border-2 cursor-pointer' to={"/createquiz"}>Create Quiz</Link></div>
  )
}

export default Home