export class TaskQueue
{
	constructor()
	{
		this.tasks = [];
		this.running = false;
	}
	
	enqueue(promise,callback,error)
	{
		//enqueue task
		this.tasks.push({promise,callback,error});
		//Try run 
		this.run();
	}
	
	async run()
	{
		//If already running 
		if (this.running)
			//Nothing
			return;
		//Running
		this.running = true;
		//Run all pending tasks
		while(this.tasks.length)
		{
			try {
				//Wait for first promise to finish
				const result = await this.tasks[0].promise;
				//Run callback
				this.tasks[0].callback(result); 
			} catch(e) {
				//Run error callback
				this.tasks[0].error(e); 
			}
			//Remove task from queue
			this.tasks.shift();
		}
		//Ended
		this.running = false;
	}
}
