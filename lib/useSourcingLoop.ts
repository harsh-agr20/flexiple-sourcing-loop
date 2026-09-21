import { useReducer } from "react";
import type { Filters, Rubric, RankedProfile } from "./types";

export type Stage =
  | "landing"
  | "generating"
  | "review"
  | "searching"
  | "results"
  | "refining"
  | "frozen";

export type ErrorInfo = { kind: string; message: string; retry: RetryAction | null };
type RetryAction = "generate" | "search" | "refine";

type State = {
  stage: Stage;
  query: string;
  filters: Filters | null;
  rubric: Rubric | null;
  results: RankedProfile[];
  filteredCount: number;
  totalCount: number;
  perProfileFeedback: Record<string, "good" | "bad">;
  chatDraft: string;
  changeLog: string[];
  error: ErrorInfo | null;
  round: number;
};

export const initialState: State = {
  stage: "landing",
  query: "",
  filters: null,
  rubric: null,
  results: [],
  filteredCount: 0,
  totalCount: 0,
  perProfileFeedback: {},
  chatDraft: "",
  changeLog: [],
  error: null,
  round: 0,
};

type Action =
  | { type: "SET_QUERY"; query: string }
  | { type: "GENERATE_START" }
  | { type: "GENERATE_OK"; filters: Filters; rubric: Rubric }
  | { type: "SET_FILTERS"; filters: Filters }
  | { type: "SET_RUBRIC"; rubric: Rubric }
  | { type: "SEARCH_START" }
  | { type: "SEARCH_OK"; results: RankedProfile[]; filteredCount: number; totalCount: number }
  | { type: "TOGGLE_PROFILE_FEEDBACK"; id: string; verdict: "good" | "bad" }
  | { type: "SET_CHAT_DRAFT"; text: string }
  | { type: "REFINE_START" }
  | {
      type: "REFINE_OK";
      filters: Filters;
      rubric: Rubric;
      changeSummary: string[];
    }
  | { type: "FREEZE" }
  | { type: "RESTART" }
  | { type: "ERROR"; error: ErrorInfo }
  | { type: "DISMISS_ERROR" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.query };
    case "GENERATE_START":
      return { ...state, stage: "generating", error: null };
    case "GENERATE_OK":
      return {
        ...state,
        stage: "review",
        filters: action.filters,
        rubric: action.rubric,
        error: null,
      };
    case "SET_FILTERS":
      return { ...state, filters: action.filters };
    case "SET_RUBRIC":
      return { ...state, rubric: action.rubric };
    case "SEARCH_START":
      return { ...state, stage: "searching", error: null };
    case "SEARCH_OK":
      return {
        ...state,
        stage: "results",
        results: action.results,
        filteredCount: action.filteredCount,
        totalCount: action.totalCount,
        perProfileFeedback: {},
        round: state.round + 1,
        error: null,
      };
    case "TOGGLE_PROFILE_FEEDBACK": {
      const current = state.perProfileFeedback[action.id];
      const next = { ...state.perProfileFeedback };
      if (current === action.verdict) {
        delete next[action.id];
      } else {
        next[action.id] = action.verdict;
      }
      return { ...state, perProfileFeedback: next };
    }
    case "SET_CHAT_DRAFT":
      return { ...state, chatDraft: action.text };
    case "REFINE_START":
      return { ...state, stage: "refining", error: null };
    case "REFINE_OK":
      return {
        ...state,
        filters: action.filters,
        rubric: action.rubric,
        changeLog: [...action.changeSummary.slice().reverse(), ...state.changeLog],
        chatDraft: "",
      };
    case "FREEZE":
      return { ...state, stage: "frozen" };
    case "RESTART":
      return initialState;
    case "ERROR":
      return { ...state, stage: prevStageOnError(state.stage), error: action.error };
    case "DISMISS_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

function prevStageOnError(stage: Stage): Stage {
  if (stage === "generating") return "landing";
  if (stage === "searching") return "review";
  if (stage === "refining") return "results";
  return stage;
}

export function useSourcingLoop() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}
