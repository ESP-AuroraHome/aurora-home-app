type UsecaseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const usecase = <TArgs, TResult>(
  fct: (args: TArgs) => Promise<TResult> | TResult,
) => {
  return async (args: TArgs): Promise<UsecaseResult<TResult>> => {
    try {
      const data = await fct(args);
      return {
        success: true,
        data,
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
