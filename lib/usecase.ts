type UsecaseResult = { success: true } | { success: false; error: string };

const usecase: Promise<UsecaseResult> = async (
  fct: (arg: unknown) => Promise<void>
) => {
  try {
    await fct;
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

export default usecase;
