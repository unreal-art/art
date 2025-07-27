import { ITabs, TabBtn } from "../../creations/components/Tabs";
import { TabText } from "@/stores/creationAndProfileStore";

// Create a type that extends TabText to include search-specific tabs
type SearchTabText = TabText | "User" | "Media";

// Create an interface for the search tab props
interface SearchTabProps {
  currentIndex: number;
  setCurrentIndex: (value: number) => void;
  section?: "creation" | "profile"; // Optional for the search component
}

// Also add a custom TabBtn interface to handle our extended tab types
interface SearchTabBtnProps {
  currentIndex: number;
  index: number;
  text: SearchTabText;
  setCurrentIndex: (value: number) => void;
  section: "creation" | "profile";
}

// Custom TabBtn component that extends the original one
function SearchTabBtn({
  currentIndex,
  index,
  text,
  setCurrentIndex,
  section,
}: SearchTabBtnProps) {
  return (
    <button
      className={`flex justify-center items-center gap-x-2 py-2 px-4 border-primary-1 ${
        currentIndex === index ? "border-b-2" : ""
      }`}
      onClick={() => setCurrentIndex(index)}
    >
      <p style={{ color: currentIndex === index ? "#DADADA" : "#5D5D5D" }}>
        {text}
      </p>
    </button>
  );
}

export default function Tabs({
  currentIndex,
  setCurrentIndex,
  section = "creation", // Default to creation for backwards compatibility
}: SearchTabProps) {
  return (
    <div className="flex gap-x-8 border-b-[1px] border-primary-11">
      <SearchTabBtn
        currentIndex={currentIndex}
        index={0}
        text="User"
        setCurrentIndex={setCurrentIndex}
        section={section}
      />

      <SearchTabBtn
        currentIndex={currentIndex}
        index={1}
        text="Media"
        setCurrentIndex={setCurrentIndex}
        section={section}
      />
    </div>
  );
}
