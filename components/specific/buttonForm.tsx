import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

interface Props {
  loading: boolean;
  text: string;
  loadingText?: string;
  disabled?: boolean;
}

const ButtonForm = ({ loading, text, loadingText, disabled }: Props) => {
  return (
    <Button
      className="bg-blue-500 w-full"
      size={"lg"}
      type="submit"
      disabled={loading || disabled}
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
