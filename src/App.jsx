import { BrowserRouter, Route, Routes } from "react-router-dom"
import CreateQuiz from "./pages/CreateQuiz"
import TakeQuiz from "./pages/TakeQuiz"
import Home from "./pages/Home"


function App() {

 return (
     <>
       {/* <NavBar /> */}
      
      <div className="min-h-screen bg-amber-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/createquiz" element={<CreateQuiz />} />
          <Route path="/takequiz/:id" element={<TakeQuiz />} />

          <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center text-3xl font-bold opacity-20">
                  404 - Lost in Space
              </div>
          } />
        </Routes>
      </div>
     </>
  )
}

export default App
