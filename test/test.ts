class X {
  readonly a: number;
  readonly b: string;
  readonly c: boolean;

	/**
	* Creates an instance of X.
	* @param X object with default values or dto to initialize the model, including:
	*	a:	number
	*	b:	string
	*	c:	boolean
	* You may use named params like: new X( { a: <value>, c: <value>,... } )
	*/
	constructor( dto: X) {
		this.a = dto.a;
		this.b = dto.b;
		this.c = dto.c;
	}


}

const test = new X();
