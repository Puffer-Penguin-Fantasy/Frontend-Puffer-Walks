import { useGamesContext } from "../components/GamesProvider";

export function useGame() {
    return useGamesContext();
}
