import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import type { ICreateTodoInput, ITodo, IUpdateTodoInput } from '@shared/todo'

const todoKeys = {
  all: ['todos'] as const
}

export function useTodos(): UseQueryResult<ITodo[]> {
  return useQuery({ queryKey: todoKeys.all, queryFn: () => window.api.todo.list() })
}

function useInvalidateTodos(): () => Promise<void> {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: todoKeys.all })
}

export function useCreateTodo(): UseMutationResult<ITodo, Error, ICreateTodoInput> {
  const invalidate = useInvalidateTodos()
  return useMutation({
    mutationFn: (input: ICreateTodoInput) => window.api.todo.create(input),
    onSuccess: invalidate
  })
}

export function useUpdateTodo(): UseMutationResult<ITodo, Error, IUpdateTodoInput> {
  const invalidate = useInvalidateTodos()
  return useMutation({
    mutationFn: (input: IUpdateTodoInput) => window.api.todo.update(input),
    onSuccess: invalidate
  })
}

export function useRemoveTodo(): UseMutationResult<void, Error, number> {
  const invalidate = useInvalidateTodos()
  return useMutation({
    mutationFn: (id: number) => window.api.todo.remove(id),
    onSuccess: invalidate
  })
}
