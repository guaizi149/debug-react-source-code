import logo from './logo.svg';
import './App.css';

function App() {
  const clickFn = () => {
    console.log('%c 🍧 clickFn: ', 'font-size:20px;background-color: #ED9EC7;color:#fff;');

  }
  return (
    <div className="App">
      <header className="App-header" onClick={clickFn}>
        <img  src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
