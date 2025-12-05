type UsecaseResult<T> = { success: true } | { success: false; error: string };

const usecase = <TArgs, TResult>(
  fct: (args: TArgs) => Promise<TResult> | TResult
) => {
  return async (args: TArgs): Promise<UsecaseResult<TResult>> => {
    try {
      await fct(args);
      return {
        success: true,
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  };
};

export default usecase;
