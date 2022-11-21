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
} from "react-bootstrap";
import $ from "jquery";

var scopes = ["user-top-read", "user-read-recently-played"];
var RPS = {};

function App() {
  const CLIENT_ID = "03df3b9ad5094f7ba2904002d7c94924";
  const REDIRECT_URI = "http://localhost:3000/";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";

  const [token, setToken] = useState("");
  const [currentUsersProfile, setCurrentUsersProfile] = useState(null);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [backgroundColor, setBackgroundColor] = useState("#ffff");

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

  $(".btn__like").click(function () {
    $(this).addClass("active");
  });

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
        <Button
          variant="info"
          className="btn__like"
          id="btn__like"
          style={{ backgroundColor: backgroundColor }}
        >
          +
        </Button>
        <p>
          "{recommendedSong.name}" by {recommendedSong.artists[0].name}
        </p>
        <br></br>
      </div>
    ));
  };

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
              <div onLoad={getRecentlyPlayedSong} id="user__card">
                {currentUsersProfile && (
                  <div>
                    {/* <p id="welcome__saying">
                      Welcome, {currentUsersProfile.display_name}
                    </p> */}
                    {currentUsersProfile.images.length &&
                      currentUsersProfile.images[0].url && (
                        <img
                          className="p-1 add-space shadow p-3 mb-5 bg-white rounded-circle"
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
                  id="recommend__btn"
                >
                  Recommended
                </Button>
                <Button
                  className="p-2"
                  onClick={getRecommendedSongs}
                  id="profile__btn"
                >
                  Profile
                </Button>
                <Button
                  className="p-2"
                  onClick={getRecommendedSongs}
                  id="discover__btn"
                >
                  Discover
                </Button>

                <Button className="p-2" onClick={logout} id="logout__btn">
                  Logout
                </Button>
              </div>

              <div id="song__list">{renderRecommendedSongs()}</div>
            </Container>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
