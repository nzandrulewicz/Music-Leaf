import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import axios from "axios";
import {
  Container,
  InputGroup,
  FormControl,
  Button,
  Row,
  Card,
} from "react-bootstrap";

var scopes = ["user-top-read", "user-read-recently-played", "playlist-modify-private", "playlist-modify-public"];
var RPS = {};
var userID;
var playlistID;
 
function App() {
  const CLIENT_ID = "716cc26765604e6c98f418c9e9ba23c3";
  const REDIRECT_URI = "https://musicleaf.herokuapp.com/callback";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";

  const [token, setToken] = useState("");
  const [currentUsersProfile, setCurrentUsersProfile] = useState(null);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  
  var recentlyPlayedSong = null;

  // rps = recently played song
  var rpsArtistApiLink = null;

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");

    if (!token && hash) {
      token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))
        .split("=")[1];

      window.location.hash = "";
      window.localStorage.setItem("token", token);
    }
    setToken(token);

    const getCurrentUsersProfile = () =>
      axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          type: "user",
        },
      });

    const fetchCurrentUsersProfile = async () => {
      try {
        const { data } = await getCurrentUsersProfile();
        setCurrentUsersProfile(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCurrentUsersProfile();
  }, []);

  function onLoadFunctions() {
    getRecentlyPlayedSong();
    checkForPlaylist();
  }

  const checkForPlaylist = async (e) => {
    //console.log("checkForPlaylist ran successfully.")

    const { data } = await axios.get(
      "https://api.spotify.com/v1/me/playlists",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 50
        },
      }
    );
    
    var playlistNames = [];
    for (var i=0; i<=50; i++)
    {
      playlistNames.push(data.items[i].name);

      if (data.items[i+1] == null)
      {
        break;
      }
    }

    if (!playlistNames.includes("Music Leaf Songs"))
    {
      //console.log("Music Leaf Songs playlist does not exist.");
      createPlaylist();
    }
    else
    {
      var index = playlistNames.indexOf("Music Leaf Songs");
      playlistID = data.items[index].id;
      console.log("Music Leaf Songs playlist has been created.")
    }
    //console.log(playlistNames);
  }

  const createPlaylist = async (e) => {
    //console.log("createPlaylist ran successfully.")
    userID = currentUsersProfile.id;
 
    const { data } = await axios.post(
      "https://api.spotify.com/v1/users/" + userID + "/playlists",
      {
        name: "Music Leaf Songs",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        }
    });

    checkForPlaylist();
  }

  const getRecentlyPlayedSong = async (e) => {
    const { data } = await axios.get(
      "https://api.spotify.com/v1/me/player/recently-played",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 1,
          type: "track",
        }
      }
    );

    //console.log(data);
    recentlyPlayedSong = data.items[0].track.name;
    RPS.rpsSongID = data.items[0].track.id;
    RPS.rpsArtistID = data.items[0].track.artists[0].id;
    rpsArtistApiLink = "https://api.spotify.com/v1/artists/" + RPS.rpsArtistID;

    document.getElementById("recentlyPlayedSong").innerHTML =
      recentlyPlayedSong;

    getRpsArtistGenre();
    //console.log(recentlyPlayedSong);
    //console.log(rpsSongID);
    //console.log(rpsArtistID);
    //console.log("getRecentlyPlayedSong ran successfully.")
  };

  const getRpsArtistGenre = async (e) => {
    const { data } = await axios.get(rpsArtistApiLink, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        id: RPS.rpsArtistID,
      },
    });

    //console.log(data);
    //console.log(RPS.rpsArtistID);
    RPS.rpsArtistGenre = data.genres[0];
  };

  const getRecommendedSongs = async (e) => {
    const { data } = await axios.get(
      "https://api.spotify.com/v1/recommendations",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 10,
          seed_tracks: RPS.rpsSongID,
          seed_artists: RPS.rpsArtistID,
          seed_genres: RPS.rpsArtistGenre,
        },
      }
    );

    //console.log(rpsSongID)
    //console.log(rpsArtistID)
    console.log(RPS.rpsArtistGenre);
    setRecommendedSongs(data.tracks);
  };

  const renderRecommendedSongs = () => {
    return recommendedSongs.map((recommendedSong) => (
      <div
        key={recommendedSong.id}
        className="p-1 add-space shadow p-3 mb-5 bg-white rounded"
        id="img__container"
      >
        <br></br>
        {recommendedSong.album.images.length ? (
          <img width="50%" src={recommendedSong.album.images[0].url} alt="" />
        ) : (
          <div>No Image</div>
        )}
        <br></br>
        <Button variant="success" id="btn__like" className=" p-3 shadow" onClick={() => addSongToPlaylist(recommendedSong)}>
          +
        </Button>
        <p>
          "{recommendedSong.name}" by {recommendedSong.artists[0].name}
        </p>
        <br></br>
      </div>
    ));
  };

  async function addSongToPlaylist(recommendedSong) {
    var songURI = recommendedSong.uri;

    console.log(songURI);
    console.log(playlistID);

    await axios.post(
      "https://api.spotify.com/v1/playlists/" + playlistID + "/tracks",
      {
        uris: [songURI],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        }
    });
  }

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  return (
    <div className="App">
      <header className="App-header">
        {!token ? (
          <a
            href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes.join(
              "%20"
            )}&response_type=${RESPONSE_TYPE}`}
            id="login__button"
          >
            Login to Spotify
          </a>
        ) : (
          <>
            <Container id="main__container">
              <div onLoad={onLoadFunctions}>
                {currentUsersProfile && (
                  <div>
                    <p id="welcome__saying">
                      Welcome, {currentUsersProfile.display_name}
                    </p>
                    {currentUsersProfile.images.length &&
                      currentUsersProfile.images[0].url && (
                        <img
                          className="p-1 add-space shadow p-3 mb-5 bg-white rounded"
                          src={currentUsersProfile.images[0].url}
                          alt="Avatar"
                        />
                      )}
                  </div>
                )}
              </div>

              <p>
                Last played song: <span id="recentlyPlayedSong"></span>
              </p>

              <Button
                variant="success"
                size="lg"
                className="shadow p-2 mb-5"
                onClick={getRecommendedSongs}
              >
                Get Recommended Songs
              </Button>

              <br></br>

              <Button
                variant="danger"
                className="shadow p-2 mb-5"
                onClick={logout}
              >
                Logout
              </Button>

              <br></br>

              {renderRecommendedSongs()}
            </Container>
          </>
        )}
      </header>
    </div>
  );
}

export default App;