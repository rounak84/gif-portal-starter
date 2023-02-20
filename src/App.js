import { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Buffer } from "buffer";
import kp from './keypair.json'
window.Buffer = Buffer;

const { SystemProgram, Keypair } = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount =  web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey("HEGvBSMbg9nKA1v1ZYJ7jXVrbgWTWwick7oPAbA6bJ1H")

const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// const TEST_GIFS = [
// 	'https://media.giphy.com/media/MdAIFbJb9aX9EocMcq/giphy.gif',
// 	'https://media.giphy.com/media/dUBQvWHBY94CmyN2TB/giphy.gif',
// 	'https://media.giphy.com/media/cXblnKXr2BQOaYnTni/giphy.gif',
// 	'https://media.giphy.com/media/BpGWitbFZflfSUYuZ9/giphy.gif',
// ]

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    // We're using optional chaining (question mark) to check if the object is null
      if (window?.solana?.isPhantom) {
        console.log('Phantom wallet found!');
        const response = await window.solana.connect({ onlyIfTrusted: true });
        console.log(
          'Connected with Public Key:',
          response.publicKey.toString()
        );

        setWalletAddress(response.publicKey.toString());
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    };

    const connectWallet = async () => {
      const { solana } = window;

      if (solana) {
        const response = await solana.connect();
        console.log('Connected with Public Key:', response.publicKey.toString());
        setWalletAddress(response.publicKey.toString());
      }
    };

    const sendGif = async () => {
      if (inputValue.length === 0) {
        console.log('Empty input. Try again.');
        return 
      }
      setInputValue('')
      console.log('Gif link: ',inputValue);
      try{
        const provider = getProvider()
        const program =  await getProgram();

        await program.rpc.addGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
          },
        });
        console.log("GIF successfully sent to program", inputValue)

        await getGifList();
      } catch(error){
        console.log("Error sending GIF: ",error)
      }
    };

    const onInputChange = (event) => {
      const { value } = event.target;
      setInputValue(value);
    };

    const getProvider = () => {
      const connection = new Connection(network, opts.preflightCommitment);
      const provider = new Provider(
        connection, window.solana, opts.preflightCommitment,
      );
      return provider;
    }

    const createGifAccount = async () => {
      try {
        const provider = getProvider();
        const program = await getProgram();

        console.log("Ping")
        await program.rpc.startStuffOff({
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          },
          signers: [baseAccount]
        });
        console.log("Created a new Base Account with address: ",baseAccount.publicKey.toString())
        await getGifList();

      } catch(error) {
        console.log("Error creating BaseAccount account: ",error)
      }
    }
   
    const renderNotConnectedContainer = () => (
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
    );

    const renderConnectedContainer = () => {
      if(gifList === null){
        return (
          <div className="connected-container">
            <button className="cta-button submit-gif-button" onClick={createGifAccount}>
              Do One-Time Initialization For GIF Program Account
            </button>
          </div>
        )
      }
      else {
        return(
          <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
        )
      }
    }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);  

  const getProgram = async () => {
    const idl = await Program.fetchIdl(programID, getProvider());
    return new Program(idl,programID,getProvider());
  };

  const getGifList = async() => {
    try{
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account ",account)
      setGifList(account.gifList)
    }catch(error) {
      console.log("Error in getGifList: ",error)
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 The Office and Age of Empires 2 GIF Collection</p>
          <p className="sub-text">
            Store your GIF collection on the Solana Blockchain ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}

          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
