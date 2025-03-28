import "./App.css";
// import { useDispatch, useSelector } from 'react-redux'
// import { RootState } from './lib/redux/store'
// import { useEffect } from 'react'
import Router from "./routes/routes";

function App() {
  // const dispatch = useDispatch()
  // const user = useSelector((state: RootState) => state.user.value)

  // useEffect(() => {
  //   const fetchData = async () => {}
  //   fetchData()
  // }, [])

  return <Router />;
}

export default App;
