import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

interface Props {
  loading: boolean;
  text: string;
  loadingText?: string;
}

const ButtonForm = ({ loading, text, loadingText }: Props) => {
  return (
    <Button
      className="bg-blue-500 w-full"
      size={"lg"}
      type="submit"
      disabled={loading}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
};

export default ButtonForm;
