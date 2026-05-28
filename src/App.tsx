import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import ExcileDraw from './modules/excileboard/ExcileBoard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/board"
          element={<ExcileDraw />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
