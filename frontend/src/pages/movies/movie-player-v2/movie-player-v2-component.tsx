import { Shade, createComponent } from "@furystack/shades";
import type { FfprobeEndpoint, Movie, MovieFile, PiRatFile, WatchHistoryEntry } from "common";
import { MovieTitle } from "./title.js";

interface MoviePlayerProps {
  file: PiRatFile
movieFile?: MovieFile
  movie?: Movie
  ffProbe: FfprobeEndpoint['result']
  watchProgress?: WatchHistoryEntry
}

export const MoviePlayerV2 = Shade<MoviePlayerProps>({
    shadowDomName: 'pirat-movie-player-v2',
    render: ({props}) => {

        return (
        <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
        }}>
            <MovieTitle file={props.file} movie={props.movie} />
        </div>
        )
    }
})