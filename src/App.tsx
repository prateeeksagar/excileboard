import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import { lazy } from 'react';

const WhiteboardPage = lazy(() => import("./modules/excileboard/ExcileBoard"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/board"
          element={<WhiteboardPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
