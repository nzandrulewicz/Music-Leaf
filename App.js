import React from "react";
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
  Modal,
} from "react-bootstrap";
import $ from "jquery";

var scopes = [
  "user-top-read",
  "user-read-recently-played",
  "playlist-modify-private",
  "playlist-modify-public",
];
var RPS = {};
var userID;
var playlistID;

function App() {
  const CLIENT_ID = "03df3b9ad5094f7ba2904002d7c94924";
  const REDIRECT_URI = "http://localhost:3000/";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";

  const [token, setToken] = useState("");
  const [currentUsersProfile, setCurrentUsersProfile] = useState(null);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [backgroundColor, setBackgroundColor] = useState("#ffff");
  const [smShow, setSmShow] = useState(false);

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
          limit: 50,
        },
      }
    );

    var playlistNames = [];
    for (var i = 0; i <= 50; i++) {
      playlistNames.push(data.items[i].name);

      if (data.items[i + 1] == null) {
        break;
      }
    }

    if (!playlistNames.includes("Music Leaf Songs")) {
      //console.log("Music Leaf Songs playlist does not exist.");
      createPlaylist();
    } else {
      var index = playlistNames.indexOf("Music Leaf Songs");
      playlistID = data.items[index].id;
      console.log("Music Leaf Songs playlist has been created.");
    }
    //console.log(playlistNames);
  };

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
        },
      }
    );

    checkForPlaylist();
  };

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
        },
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
      <div key={recommendedSong.id} className="" id="img__container">
        {recommendedSong.album.images.length ? (
          <img
            width="50%"
            src={recommendedSong.album.images[0].url}
            alt=""
            id="img__song"
          />
        ) : (
          <div>No Image</div>
        )}
        <Button
          variant="info"
          className="btn__like"
          id="btn__like"
          style={{ backgroundColor: backgroundColor }}
          onClick={() => {
            addSongToPlaylist(recommendedSong);
            setSmShow(true);
          }}
        >
          +
        </Button>
        <p id="song__creds">
          "{recommendedSong.name}" by {recommendedSong.artists[0].name}
        </p>
        <br></br>
        <Modal
          size="sm"
          show={smShow}
          onHide={() => setSmShow(false)}
          aria-labelledby="example-modal-sizes-title-sm"
        >
          <Modal.Header closeButton>
            <Modal.Title id="example-modal-sizes-title-sm">
              Successfully Added!
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>song successfully added to Leaf playlist</Modal.Body>
        </Modal>
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
        },
      }
    );
  }

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  $(".btn__like").click(function () {
    $(this).addClass("active");
  });

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
            <div id="overall">
              <div id="nav__bar">
                <div id="search__container">
                  <input type="text" id="search__bar" />
                  <div id="search__background">
                    <img src={require("./search.png")} id="search__img" />
                  </div>
                </div>

                <div id="title__name">
                  <img src={require("./leaf.png")} id="logo__img" />
                  Leaf
                </div>
              </div>
              <Container id="main__container">
                <div onLoad={onLoadFunctions} id="user__card">
                  {currentUsersProfile && (
                    <div>
                      {/* <p id="welcome__saying">
                      Welcome, {currentUsersProfile.display_name}
                    </p> */}
                      {currentUsersProfile.images.length &&
                        currentUsersProfile.images[0].url && (
                          <img
                            className="p-1 add-space mb-5 rounded-circle"
                            src={currentUsersProfile.images[0].url}
                            alt="Avatar"
                            id="user__img"
                          />
                        )}
                    </div>
                  )}
                  <p id="last__played">
                    LAST PLAYED SONG: <span id="recentlyPlayedSong"></span>
                  </p>

                  <Button
                    className="p-2"
                    onClick={getRecommendedSongs}
                    id="site__btn"
                  >
                    <img src={require("./heart.png")} id="icon__img" />
                    Recommended
                  </Button>
                  <Button
                    className="p-2"
                    onClick={getRecommendedSongs}
                    id="site__btn"
                  >
                    <img src={require("./user.png")} id="icon__img" />
                    Profile
                  </Button>
                  <Button
                    className="p-2"
                    onClick={getRecommendedSongs}
                    id="site__btn"
                  >
                    <img src={require("./world.png")} id="icon__img" />
                    Discover
                  </Button>

                  <Button className="p-2" onClick={logout} id="site__btn">
                    <img src={require("./logout.png")} id="icon__img" />
                    Logout
                  </Button>
                </div>

                <div id="song__list">{renderRecommendedSongs()}</div>
              </Container>
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
