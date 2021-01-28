export class CreateUserDto {
  readonly id: number;
  readonly viewedMovies: Array<number>;
  readonly favoriteMovies: Array<number>;
}
